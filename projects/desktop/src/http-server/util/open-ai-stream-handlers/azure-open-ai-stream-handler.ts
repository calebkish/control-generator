
import { Context } from 'hono';
import { AzureKeyCredential, ChatRequestMessageUnion, OpenAIClient } from '@azure/openai';
import { Chat } from '../../db/schema.js';

export async function* azureOpenAiStreamHandler(
  c: Context,
  systemPrompt: string,
  userPrompt: string,
  endpoint: string,
  apiKey: string,
  chat: Chat,
  model: string
): AsyncGenerator<string, void, unknown> {
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
  const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
  const events = await client.streamChatCompletions(model, history, {
    abortSignal: c.req.raw.signal,
  });

  for await (const event of events) {
    if (c.req.raw.signal.aborted) {
      break;
    }
    const responseChunk = event.choices.at(0)?.delta?.content;
    if (responseChunk) {
      yield responseChunk;
    }
  }
}
