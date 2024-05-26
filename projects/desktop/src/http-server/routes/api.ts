import { Hono } from 'hono'
import { controlRouter } from './control.js';
import { llmRouter } from './llm.js';
import { transcribeRouter } from './transcribe.js';

export const apiRouter = new Hono();

apiRouter.route('', controlRouter);
apiRouter.route('', llmRouter);
apiRouter.route('', transcribeRouter);
