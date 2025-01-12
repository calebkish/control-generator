import path from 'node:path';
import { userDataDir } from '../args.js';
import { z } from 'zod';
import { Context, Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { Chat, LlmConfigOpenAiOption, LlmConfigLocalLlamaOption, LlmConfigOption, chatsTable, llmConfigOpenAiOptions as llmConfigOpenAiOptions, llmConfigsTable } from '../db/schema.js';
import { ChatHistoryItem, ChatModelResponse, ChatUserMessage, Llama3ChatWrapper, LlamaChatSession, LlamaLogLevel, LlamaModel, getLlama } from 'node-llama-cpp';
import fs from 'node:fs';
import { Writable } from 'node:stream';
import { BehaviorSubject, from, switchMap, throttleTime } from 'rxjs';
import { ConfigVm, LlmConfigOptionResponse } from '../models/index.js';
import { openAiStreamHandler } from '../util/open-ai-stream-handlers/open-ai-stream-handler.js';
import { azureOpenAiStreamHandler } from '../util/open-ai-stream-handlers/azure-open-ai-stream-handler.js';
import { fileExists } from '../util/file-exists.js';

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
    } else if (config.document.value.type === 'OPENAI_V1') {
      const { apiKey, endpoint, model } = config.document.value;
      if (!model) {
        return c.json({
          success: false,
          msg: `Model not specified for the config "${config.option}"`
        }, 500);
      }
      return handleOpenAiPromptStream(c, systemPrompt, userPrompt, chat, apiKey, endpoint, model, config.option);
    } else {
      return c.notFound();
    }
  },
);

/**
 * @param model aka "deploymentId" for Azure Open AI
 * @param configOption aka "vendor"
 */
async function handleOpenAiPromptStream(
  c: Context<any>,
  systemPrompt: string,
  userPrompt: string,
  chat: Chat,
  apiKey: string,
  endpoint: string,
  model: string,
  configOption: LlmConfigOption
): Promise<Response> {
  let events: AsyncGenerator<string, void, unknown> | null = null;
  if (configOption === 'OpenAI') {
    events = openAiStreamHandler(c, systemPrompt, userPrompt, endpoint, apiKey, chat, model);
  } else if (configOption === 'Azure OpenAI') {
    events = azureOpenAiStreamHandler(c, systemPrompt, userPrompt, endpoint, apiKey, chat, model);
  }

  if (events === null) {
    return c.json({ success: false, msg: `Unknown config option "${configOption}"` }, 500);
  }

  return streamText(c, async (stream) => {
    // Abort signals aren't captured if nothing is written to the stream for some reason...
    await stream.write('');

    let aiAnswer = '';
    for await (const event of events) {
      aiAnswer += event;
      await stream.write(event);
    }

    if (c.req.raw.signal.aborted) {
      console.log('Aborted!');
      return;
    }

    await addToHistory(chat, userPrompt, aiAnswer);
    await stream.close();
  }, async (e, stream) => {
    await stream.writeln(`Error: ${(e as Error)?.message}`);
    await stream.close();
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

// add local llama config (downloads model file)
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
      // Abort signals aren't captured if nothing is written to the stream for some reason...
      await stream.write('0');

      const subscription = progress$.pipe(
        throttleTime(500),
        switchMap((progress) => from(stream.write(progress.toString())))
      ).subscribe();

      try {
        let bytesRead = 0;
        await response.body!
          .pipeThrough(
            new TransformStream({
              transform: async (chunk, controller) => {
                bytesRead += chunk.byteLength;
                const progress = Math.round((bytesRead / contentLengthNum) * 100);
                progress$.next(progress);
                controller.enqueue(chunk);
              },
            }),
            { signal: c.req.raw.signal }
          )
          .pipeTo(
            writableStream,
            { signal: c.req.raw.signal }
          );
      } catch (error) {
        const isAbortError = error instanceof DOMException && error.name === 'AbortError';
        if (!isAbortError) {
          console.error('There was an error when streaming file download progress:', error);
        }
        if (await fileExists(modelFilePath)) {
          await fs.promises.unlink(modelFilePath);
        }
        await stream.close();
        return;
      } finally {
        subscription.unsubscribe();
      }

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
    });
  },
);


const localLlamaOptionTemplates: { option: LlmConfigLocalLlamaOption, fileName: string, downloadUrl: string }[] = [
  {
    option: 'Llama 3.2 1B Instruct Q6 K L',
    fileName: 'Llama-3.2-1B-Instruct-Q6_K_L.gguf',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q6_K_L.gguf',
  },
  {
    option: 'Llama 3.2 3B Instruct Q6 K L',
    fileName: 'Llama-3.2-3B-Instruct-Q6_K_L.gguf',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q6_K_L.gguf',
  },
];

const openAiOptionTemplates: { option: LlmConfigOpenAiOption }[] = [
  {
    option: 'Azure OpenAI',
  },
  {
    option: 'OpenAI',
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

    const openAiOptions: LlmConfigOptionResponse[] = openAiOptionTemplates.map(template => {
      return {
        option: template.option,
        type: 'OPENAI_V1',
      };
    });

    const options = fileOptions.concat(openAiOptions);

    return c.json(options);
  },
);

// get user-created configs
llmRouter.get('configs',
  async (c) => {
    const configs = await db.query.llmConfigsTable.findMany();

    const configsVm: ConfigVm[] = configs.map(c => {
      const configVm: ConfigVm = {
        id: c.id,
        isActive: c.isActive,
        option: c.option, // @TODO make this a name-able thing
        type: c.document.value.type,
      };

      if (c.document.value.type === 'OPENAI_V1') {
        configVm.model = c.document.value.model;
      }

      return configVm;
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


// add openai config
const addOpenaiConfigValidator = z.object({
  apiKey: z.string(),
  endpoint: z.string().url(),
  option: z.enum(llmConfigOpenAiOptions),
  model: z.string().optional(),
});
llmRouter.post('configs/openai',
  async (c) => {
    const unparsed = await c.req.json();

    const parsed = await addOpenaiConfigValidator.spa(unparsed);
    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const { option, apiKey, endpoint, model } = parsed.data;
    await db.insert(llmConfigsTable)
      .values({
        document: {
          schemaVersion: 1,
          value: {
            type: 'OPENAI_V1',
            apiKey,
            endpoint,
            model,
          }
        },
        isActive: false,
        option,
      });

    return c.json({ success: true });
  },
);

// set the model on an openai config
const setModelOnOpenaiConfigValidator = z.object({
  option: z.enum(llmConfigOpenAiOptions),
  model: z.string(),
});
llmRouter.post('configs/openai/model',
  async (c) => {
    const unparsed = await c.req.json();

    const parsed = await setModelOnOpenaiConfigValidator.spa(unparsed);
    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const { option, model } = parsed.data;
    const config = await db.query.llmConfigsTable.findFirst({
      where: eq(llmConfigsTable.option, option)
    });
    if (!config) {
      return c.notFound();
    }
    if (config.document.value.type !== 'OPENAI_V1') {
      return c.json({ success: false }, 400);
    }

    // mutate
    config.document.value.model = model;

    await db.update(llmConfigsTable)
      .set({
        document: config.document,
      })
      .where(eq(llmConfigsTable.option, option));

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
      if (await fileExists(modelPath)) {
        await fs.promises.unlink(modelPath);
      }
    }

    await db.delete(llmConfigsTable)
      .where(eq(llmConfigsTable.id, configIdNum));

    return c.json({ success: true });
  }
);
