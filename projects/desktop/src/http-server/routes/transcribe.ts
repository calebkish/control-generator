import buffer from 'node:buffer';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'hono/streaming';

export async function formDataToObject(formData: FormData) {
  const data: Record<string, any> = {};
  formData.forEach((value, key, parent) => {
    data[key] = formData.get(key);
  });
  return data;
}

export const transcribeRouter = new Hono();

const oneMb = 1024 * 1024;

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const fileTypeToExtension: Record<string, string> = {
  'audio/wave': 'wav',
  'audio/wav': 'wav',
  'audio/mp4': 'm4a',
};

const transcribeValidator = z.object({
  file: z
    .custom<buffer.File>((val) => {
      return val instanceof buffer.File;
    })
    // .refine((val) => val.size <= oneMb, (val) => ({ message: `Image must be 1 MiB or less. Uploaded file size: ${formatBytes(val.size)}` }))
    .refine((val) => Object.keys(fileTypeToExtension).includes(val.type), (val) => ({ message: `Image of type ${val.type} not supported. Supported types: ${Object.keys(fileTypeToExtension).join(', ')}` })),
});
transcribeRouter.post('/transcribe',
  zValidator('form', transcribeValidator),
  async (c) => {
    const reqFormData = await c.req.formData();

    try {
      const res: { text: string } = await fetch('http://localhost:8080/inference', {
        method: 'POST',
        // @BUG including this header makes shit break. Content-Type is possibly
        // getting concatenated w/ another 'multipart/form-data'.
        // headers: {
        //   'Content-Type': 'multipart/form-data',
        // },
        body: reqFormData,
        signal: c.req.raw.signal,
      })
        .then(x => x.json());

      // @TODO some day...
      // const decoder = new TextDecoder('utf-8');
      // return streamText(c, async (stream) => {
      //   res.body!.pipeTo(new WritableStream({
      //     write: async (chunk, controller) => {
      //       const decoded = decoder.decode(chunk);
      //       await stream.write(decoded);
      //     },
      //   }));
      // });

      const text = res.text.trim();
      return c.json({ success: true, text });
    } catch (error) {
      console.error(error);
      return c.json({ success: false }, 500);
    }
  },
);
