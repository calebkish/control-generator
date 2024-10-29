import path from 'node:path';
import { userDataDir } from '../args.js';
import { z } from 'zod';
import { Context, Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { Chat, LlmConfigAzureOpenAiOption, LlmConfigLocalLlamaOption, LlmConfigOption, chatsTable, llmConfigAzureOpenAiOptions, llmConfigsTable } from '../db/schema.js';
import { ChatHistoryItem, ChatModelResponse, ChatUserMessage, Llama3ChatWrapper, LlamaChatSession, LlamaLogLevel, LlamaModel, getLlama } from 'node-llama-cpp';
import fs from 'node:fs';
import { Writable } from 'node:stream';
import { BehaviorSubject, from, switchMap, throttleTime } from 'rxjs';
import { ConfigVm, LlmConfigOptionResponse } from '../models/index.js';
import { AzureKeyCredential, ChatRequestMessageUnion, OpenAIClient } from '@azure/openai';

type LoadedModel = {
  modelPath: string;
  model: LlamaModel;
}

let loadedModel: LoadedModel | null = null;
async function getLocalModel(modelPath: string): Promise<LoadedModel> {
  if (loadedModel !== null && loadedModel.modelPath === modelPath) {
    return loadedModel;
  }
  console.log('loading model at path:', modelPath);
  const llama = await getLlama({
    logLevel: LlamaLogLevel.error,
    gpu: false,
  });
  const model = await llama.loadModel({ modelPath });
  loadedModel = { modelPath, model };
  return loadedModel;
}

async function createLocalSession(
  modelPath: string,
  systemPrompt: string,
  history: ChatHistoryItem[] = []
) {
  const { model } = await getLocalModel(modelPath);
  const chatWrapper = new Llama3ChatWrapper();
  const context = await model.createContext();
  // @TODO try this
  // const context = await model.createContext({
  //   threads: 1,
  // });
  const contextSequence = context.getSequence();
  const session = new LlamaChatSession({ contextSequence, chatWrapper });
  session.setChatHistory([
    {
      type: 'system',
      text: systemPrompt,
    },
    ...history
  ]);
  return session;
}


export const llmRouter = new Hono();

// prompt
const locaLlmPromptValidator = z.object({
  systemPrompt: z.string(),
  userPrompt: z.string(),
  configId: z.number(),
});
llmRouter.post('/chat/:chatId/prompt',
  async (c) => {
    const chatId = c.req.param('chatId');
    const chatIdNum = parseInt(chatId);
    if (Number.isNaN(chatIdNum)) {
      return c.json({ success: false }, 400);
    }

    // This could throw
    const unparsed = await c.req.json();

    const parsed = await locaLlmPromptValidator.spa(unparsed);
    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const chat = await db.query.chatsTable.findFirst({
      where: eq(chatsTable.id, chatIdNum),
    });

    if (!chat) {
      return c.notFound();
    }

    const config = await db.query.llmConfigsTable.findFirst({
      where: eq(llmConfigsTable.id, parsed.data.configId),
    });

    if (!config) {
      return c.notFound();
    }

    const { systemPrompt, userPrompt } = parsed.data;
    if (config.document.value.type === 'LOCAL_LLAMA_V1') {
      return handleLocalLlamaPromptStream(c, config.document.value.fileName, systemPrompt, userPrompt, chat);
    } else if (config.document.value.type === 'AZURE_OPENAI_V1') {
      const { apiKey, endpoint } = config.document.value;
      return handleAzureOpenAiPromptStream(c, systemPrompt, userPrompt, chat, apiKey, endpoint, config.option as LlmConfigAzureOpenAiOption);
    } else {
      return c.notFound();
    }
  },
);

async function handleAzureOpenAiPromptStream(
  c: Context<any>,
  systemPrompt: string,
  userPrompt: string,
  chat: Chat,
  apiKey: string,
  endpoint: string,
  option: LlmConfigAzureOpenAiOption
) {
  const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

  const deploymentId = option === 'Azure OpenAI ChatGPT 4' ? 'gpt-4' : null;

  if (deploymentId === null) {
    return c.json({ success: false }, 500);
  }

  const history: ChatRequestMessageUnion[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...chat.document.value.history.map(item => {
      if (item.type === 'model') {
        return {
          role: 'assistant',
          content: item.response.at(0)!,
        };
      } else {
        return {
          role: item.type,
          content: item.text,
        };
      }
    }),
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  return streamText(c, async (textStream) => {
    // Abort signals aren't captured if nothing is written to the stream for some reason...
    await textStream.write('');

    const events = await client.streamChatCompletions(deploymentId, history, {
      abortSignal: c.req.raw.signal,
    });
    let aiAnswer = '';
    for await (const event of events) {
      const responseChunk = event.choices.at(0)?.delta?.content;
      if (responseChunk) {
        aiAnswer += responseChunk;
        await textStream.write(responseChunk);
      }
    }

    if (c.req.raw.signal.aborted) {
      console.log('Aborted!');
      return;
    }

    await addToHistory(chat, userPrompt, aiAnswer);
  });
}

async function handleLocalLlamaPromptStream(
  c: Context<any>,
  fileName: string,
  systemPrompt: string,
  userPrompt: string,
  chat: Chat
) {
  const modelPath = path.join(userDataDir, fileName);
  const session = await createLocalSession(
    modelPath,
    systemPrompt,
    chat.document.value.history
  );

  return streamText(c, async (textStream) => {
    // Abort signals aren't captured if nothing is written to the stream for some reason...
    await textStream.write('');

    const aiAnswer = await session.prompt(userPrompt, {
      onToken: (tokens) => {
        const text = session.model.detokenize(tokens);
        textStream.write(text);
      },
      signal: c.req.raw.signal,
    });

    if (c.req.raw.signal.aborted) {
      console.log('Aborted!');
      return;
    }

    await addToHistory(chat, userPrompt, aiAnswer);
  });
}

async function addToHistory(
  chat: Chat,
  userPrompt: string,
  aiAnswer: string
) {
  const userMessage: ChatUserMessage = {
    type: 'user',
    text: userPrompt,
  };
  const modelResponse: ChatModelResponse = {
    type: 'model',
    response: [aiAnswer],
  };
  const historyToAddTo = chat.document.value.history;
  historyToAddTo.push(userMessage);
  historyToAddTo.push(modelResponse);
  await db.update(chatsTable)
    .set({
      document: chat.document,
    })
    .where(eq(chatsTable.id, chat.id));
}

llmRouter.delete('/chat/:chatId/history',
  async (c) => {
    const chatId = c.req.param('chatId');
    const chatIdNum = parseInt(chatId);
    if (Number.isNaN(chatIdNum)) {
      return c.json({ success: false }, 400);
    }
    const chat = await db.query.chatsTable.findFirst({
      where: eq(chatsTable.id, chatIdNum),
    });

    if (!chat) {
      return c.notFound();
    }

    chat.document.value.history = [];

    await db.update(chatsTable)
      .set({
        document: chat.document,
      })
      .where(eq(chatsTable.id, chatIdNum));

    return c.json({ success: true });
  },
);

// add local llama config
llmRouter.post('file/:option',
  async (c) => {
    const option = c.req.param('option') as LlmConfigOption;

    const foundAvailableFile = localLlamaOptionTemplates.find(f => f.option === option);

    if (!foundAvailableFile) {
      return c.json({ success: false }, 404);
    }

    const config = await db.query.llmConfigsTable.findFirst({
      where: eq(llmConfigsTable.option, foundAvailableFile.option),
    });

    if (config) {
      return c.json({ success: false }, 500);
    }

    const response = await fetch(foundAvailableFile.downloadUrl, {
      signal: c.req.raw.signal,
    });

    const contentLength = response.headers.get('content-length');
    const contentLengthNum = contentLength ? parseInt(contentLength) : NaN;

    if (response.body === null || Number.isNaN(contentLengthNum)) {
      return c.json({ success: false }, 500);
    }

    const modelFilePath = path.join(userDataDir, foundAvailableFile.fileName);

    const fsWriteStream = fs.createWriteStream(modelFilePath, { encoding: 'binary', flags: 'w', flush: true });
    const writableStream = Writable.toWeb(fsWriteStream);

    const progress$ = new BehaviorSubject<number>(0);

    return streamText(c, async (stream) => {
      await stream.write('0');

      stream.onAbort(() => {
        console.log('on stream abort!');
        subscription.unsubscribe();
        fs.unlinkSync(path.join(userDataDir, foundAvailableFile.fileName));
      });

      const subscription = progress$.pipe(
        throttleTime(500),
        switchMap((progress) => from(stream.write(progress.toString())))
      ).subscribe();

      let bytesRead = 0;
      await response.body!
        .pipeThrough(new TransformStream({
          transform: async (chunk, controller) => {
            bytesRead += chunk.byteLength;
            const progress = Math.round((bytesRead / contentLengthNum) * 100);
            progress$.next(progress);
            controller.enqueue(chunk);
          },
        }), { signal: c.req.raw.signal })
        .pipeTo(writableStream, { signal: c.req.raw.signal });

      subscription.unsubscribe();
      await db.insert(llmConfigsTable)
        .values({
          option: foundAvailableFile.option,
          document: {
            schemaVersion: 1,
            value: {
              type: 'LOCAL_LLAMA_V1',
              fileName: foundAvailableFile.fileName,
            },
          },
        });
      await stream.write('100');
      await stream.close();
    }, async (error, stream) => {
      console.error('STREAM ERROR:', error);
    });
  },
);


const localLlamaOptionTemplates: { option: LlmConfigLocalLlamaOption, fileName: string, downloadUrl: string }[] = [
  {
    option: 'Llama 3 8B Instruct Q2 K',
    fileName: 'Meta-Llama-3-8B-Instruct-Q2_K.gguf',
    downloadUrl: 'https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct-Q2_K.gguf',
  },
  {
    option: 'Llama 3 8B Instruct Q8 0',
    fileName: 'Meta-Llama-3-8B-Instruct-Q8_0.gguf',
    downloadUrl: 'https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct-Q8_0.gguf',
  },
];

const azureOpenAiOptionTemplates: { option: LlmConfigAzureOpenAiOption }[] = [
  {
    option: 'Azure OpenAI ChatGPT 4',
  },
];

// get available options
llmRouter.get('models',
  async (c) => {
    const configs = await db.query.llmConfigsTable.findMany();

    const fileOptions: LlmConfigOptionResponse[] = localLlamaOptionTemplates
      // if a config already exists for a local llm, do not show the option.
      .filter(template => !configs.find(c => c.option === template.option))
      .map(template => {
        return {
          option: template.option,
          type: 'LOCAL_LLAMA_V1',
        };
      });

    const azureOpenAiOptions: LlmConfigOptionResponse[] = azureOpenAiOptionTemplates.map(template => {
      return {
        option: template.option,
        type: 'AZURE_OPENAI_V1',
      };
    });

    const options = fileOptions.concat(azureOpenAiOptions);

    return c.json(options);
  },
);

// get user-created configs
llmRouter.get('configs',
  async (c) => {
    const configs = await db.query.llmConfigsTable.findMany();

    const configsVm: ConfigVm[] = configs.map(c => {
      return {
        id: c.id,
        isActive: c.isActive,
        option: c.option, // @TODO make this a name-able thing
      };
    })

    return c.json(configsVm);
  },
);

// activate a config
llmRouter.post('configs/:configId/activate',
  async (c) => {
    const configId = c.req.param('configId');
    const configIdNum = parseInt(configId);
    if (Number.isNaN(configId)) {
      return c.json({ success: false }, 400);
    }

    const config = await db.query.llmConfigsTable.findFirst({
      where: eq(llmConfigsTable.id, configIdNum),
    });

    if (!config) {
      return c.notFound();
    }

    await db.update(llmConfigsTable)
      .set({ isActive: false });
    await db.update(llmConfigsTable)
      .set({ isActive: true })
      .where(eq(llmConfigsTable.id, configIdNum));

    return c.json({ success: true });
  },
);


// add azure openai config
const addAzureOpenaiConfigValidator = z.object({
  apiKey: z.string(),
  endpoint: z.string().url(),
  option: z.enum(llmConfigAzureOpenAiOptions),
});
llmRouter.post('configs/azure-openai',
  async (c) => {
    const unparsed = await c.req.json();

    const parsed = await addAzureOpenaiConfigValidator.spa(unparsed);
    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const { option, apiKey, endpoint } = parsed.data;
    await db.insert(llmConfigsTable)
      .values({
        document: {
          schemaVersion: 1,
          value: {
            type: 'AZURE_OPENAI_V1',
            apiKey,
            endpoint,
          }
        },
        isActive: false,
        option,
      });

    return c.json({ success: true });
  },
);

// delete a config
llmRouter.delete('configs/:configId',
  async (c) => {
    const configId = c.req.param('configId');
    const configIdNum = parseInt(configId);
    if (Number.isNaN(configId)) {
      return c.json({ success: false }, 400);
    }

    const llmConfig = await db.query.llmConfigsTable.findFirst({
      where: eq(llmConfigsTable.id, configIdNum),
    });
    if (!llmConfig) {
      return c.notFound();
    }

    if (llmConfig.document.value.type == 'LOCAL_LLAMA_V1') {
      const modelPath = path.join(userDataDir, llmConfig.document.value.fileName);
      if (fs.statSync(modelPath, { throwIfNoEntry: false })) {
        fs.unlinkSync(path.join(userDataDir, llmConfig.document.value.fileName));
      }
    }

    await db.delete(llmConfigsTable)
      .where(eq(llmConfigsTable.id, configIdNum));

    return c.json({ success: true });
  }
);
