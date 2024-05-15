import path from 'node:path';
import { userDataDir } from '../args.js';
import { z } from 'zod';
import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { db } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { chatsTable } from '../db/schema.js';
import { ChatHistoryItem, ChatModelResponse, ChatUserMessage, Llama3ChatWrapper, LlamaChatSession, LlamaLogLevel, LlamaModel, getLlama } from 'node-llama-cpp';


// const modelPath = path.join(userDataDir, 'mistral-7b-instruct-v0.2.Q4_K_M.gguf');
const modelPath = path.join(userDataDir, 'Meta-Llama-3-8B-Instruct.Q8_0.gguf');

let loadedModel: LlamaModel | null = null;
async function getModel(): Promise<LlamaModel> {
  if (loadedModel !== null) {
    return loadedModel;
  }
  console.log('loading model');
  const llama = await getLlama({
    logLevel: LlamaLogLevel.error,
    gpu: false,
  });
  const model = await llama.loadModel({ modelPath });
  loadedModel = model;
  return model;
}

async function createSession(systemPrompt: string, history: ChatHistoryItem[] = []) {
  const model = await getModel();
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

const llmPromptValidator = z.object({
  systemPrompt: z.string(),
  userPrompt: z.string(),
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

    const parsed = await llmPromptValidator.spa(unparsed);
    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const chat = await db.query.chatsTable.findFirst({
      where: eq(chatsTable.id, chatIdNum),
    });

    if (!chat) {
      return c.notFound();
    }

    // const session = await createSession(chat.document.value.systemPrompt, chat.document.value.history);
    const session = await createSession(parsed.data.systemPrompt, chat.document.value.history);

    return streamText(c, async (textStream) => {
      // Abort signals aren't captured if nothing is written to the stream for some reason...
      await textStream.write('');

      const aiAnswer = await session.prompt(parsed.data.userPrompt, {
        onToken: (tokens) => {
          const text = session.model.detokenize(tokens);
          console.log(text);
          textStream.write(text);
        },
        signal: c.req.raw.signal,
      });

      if (c.req.raw.signal.aborted) {
        return;
      }

      const userMessage: ChatUserMessage = {
        type: 'user',
        text: parsed.data.userPrompt,
      };
      const modelResponse: ChatModelResponse = {
        type: 'model',
        response: [aiAnswer],
      };
      const historyToAddTo = chat.document.value.history;
      historyToAddTo.push(userMessage);
      historyToAddTo.push(modelResponse);
      await db.update(chatsTable).set({
        document: chat.document,
      });

    });
  },
);

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

// llmRouter.post('/llm',
//   zValidator('json', llmPromptValidator),
//   async (c) => {
//     const body = c.req.valid('json');

//     return streamText(c, async (textStream) => {
//       // Abort signals aren't captured if nothing is written to the stream for some reason...
//       await textStream.write('');

//       const model = new LlamaCpp({ modelPath: llamaPath });
//       const prompt = body.userPrompt;
//       const llmStream = await model.stream(prompt);
//       if (c.req.raw.signal.aborted) {
//         console.log('Aborted');
//         return; // do early return if request was immediately aborted
//       }
//       for await (const chunk of llmStream) { // llmStream will be locked when in this loop
//         if (c.req.raw.signal.aborted) {
//           console.log('Aborted');
//           break; // will cancel the llmStream
//         }
//         console.log(chunk);
//         await textStream.write(chunk);
//       }

//       // await llmStream
//       //   .pipeTo(new WritableStream({
//       //     write: async (chunk) => {
//       //       console.log(chunk);
//       //       await stream.write(chunk);
//       //     },
//       //     abort: async (error) => {
//       //       console.log('Stream was aborted!', error);
//       //       // await stream.close();
//       //       // await llmStream.cancel();
//       //     },
//       //     close: async () => {
//       //       console.log('stream was closed!');
//       //       // await stream.close();
//       //       // await llmStream.cancel();
//       //     },
//       //   }));

//     //   let result: IteratorResult<string, any> | null = null;
//     //   do
//     //   {
//     //     result = await llmStream.next();
//     //     if (result === null) {
//     //       console.log('result is null');
//     //       break;
//     //     }
//     //     if (result.value !== undefined) {
//     //       console.log(`writing value: ${result.value}`);
//     //       await stream.write(result.value);
//     //     }
//     //   }
//     //   while (!result.done && !aborted);
//     //   llmStream
//     //   // llmStream.cancel();
//     //   console.log('done');
//     });
//   }
// );
