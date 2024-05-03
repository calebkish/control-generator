import path from 'node:path';
import { Hono } from 'hono'
import { db } from '../db/index.js';
import { controlsTable } from '../db/schema.js';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'hono/streaming';
import { LlamaCpp } from '@langchain/community/llms/llama_cpp';
import { userDataDir } from '../args.js';

const upsertControlValidator = z.object({
  name: z.string().min(4, 'Must be at least 4 characters long'),
  type: z.string(),
  ipe: z.array(z.string()),
  frequency: z.string(),
  judgements: z.array(z.string()),
  quantitativeThesholds: z.array(z.string()),
  qualitativeThresholds: z.array(z.string()),
  investigationProcess: z.string(),
  description: z.string(),
});

export const apiRouter = new Hono();

apiRouter.get('/controls',
  async (c) => {
    const controls = await db.query.controlsTable.findMany();
    return c.json(controls);
  },
);

apiRouter.post('/controls',
  zValidator('json', upsertControlValidator),
  async (c) => {
    const body = c.req.valid('json');
    await db.insert(controlsTable).values({
      name: body.name,
      value: {
        schemaVersion: 1,
        type: body.type,
        ipe: body.ipe,
        frequency: body.frequency,
        judgements: body.judgements,
        quantitativeThesholds: body.quantitativeThesholds,
        qualitativeThresholds: body.qualitativeThresholds,
        investigationProcess: body.investigationProcess,
        description: body.description,
      }
    });
    return c.status(201);
  },
);

// const llamaPath = path.join(userDataDir, 'mistral-7b-instruct-v0.2.Q4_K_M.gguf');
const llamaPath = path.join(userDataDir, 'Meta-Llama-3-8B-Instruct.Q8_0.gguf');

const llmValidator = z.object({
  prompt: z.string(),
});

apiRouter.post('/llm',
  zValidator('json', llmValidator),
  async (c) => {
    const body = c.req.valid('json');

    return streamText(c, async (textStream) => {
      // Abort signals aren't captured if nothing is written to the stream for some reason...
      await textStream.write('');

      const model = new LlamaCpp({ modelPath: llamaPath });
      const prompt = body.prompt;
      const llmStream = await model.stream(prompt);
      if (c.req.raw.signal.aborted) {
        console.log('Aborted');
        return; // do early return if request was immediately aborted
      }
      for await (const chunk of llmStream) { // llmStream will be locked when in this loop
        if (c.req.raw.signal.aborted) {
          console.log('Aborted');
          break; // will cancel the llmStream
        }
        console.log(chunk);
        await textStream.write(chunk);
      }

      // await llmStream
      //   .pipeTo(new WritableStream({
      //     write: async (chunk) => {
      //       console.log(chunk);
      //       await stream.write(chunk);
      //     },
      //     abort: async (error) => {
      //       console.log('Stream was aborted!', error);
      //       // await stream.close();
      //       // await llmStream.cancel();
      //     },
      //     close: async () => {
      //       console.log('stream was closed!');
      //       // await stream.close();
      //       // await llmStream.cancel();
      //     },
      //   }));

    //   let result: IteratorResult<string, any> | null = null;
    //   do
    //   {
    //     result = await llmStream.next();
    //     if (result === null) {
    //       console.log('result is null');
    //       break;
    //     }
    //     if (result.value !== undefined) {
    //       console.log(`writing value: ${result.value}`);
    //       await stream.write(result.value);
    //     }
    //   }
    //   while (!result.done && !aborted);
    //   llmStream
    //   // llmStream.cancel();
    //   console.log('done');
    });
  }
);
