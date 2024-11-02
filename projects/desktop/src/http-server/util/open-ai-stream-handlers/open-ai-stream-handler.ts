import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { Chat } from '../../db/schema.js';
import { Context } from 'hono';

export async function* openAiStreamHandler(
  c: Context,
  systemPrompt: string,
  userPrompt: string,
  endpoint: string,
  apiKey: string,
  chat: Chat,
  model: string
): AsyncGenerator<string, void, unknown> {
  const client = new OpenAI({ baseURL: endpoint, apiKey: apiKey });

  const history: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...chat.document.value.history.map((item): ChatCompletionMessageParam => {
      if (item.type === 'model') {
        return {
          role: 'assistant',
          content: item.response.at(0)! as string,  // not correctish
        };
      } else {
        return {
          role: item.type,
          content: item.text as string, // not correctish
        };
      }
    }),
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const events = await client.chat.completions.create({
    model,
    messages: history,
    stream: true,
  }, {
    signal: c.req.raw.signal,
  });

  for await (const event of events) {
    if (c.req.raw.signal.aborted) {
      break;
    }
    const responseChunk = event.choices.at(0)?.delta?.content;
    if (responseChunk) {
      yield responseChunk;
      // aiAnswer += responseChunk;
      // await textStream.write(responseChunk);
    }
  }
}
