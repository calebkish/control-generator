import { Hono } from 'hono'
import { controlRouter } from './control.js';
import { llmRouter } from './llm.js';

export const apiRouter = new Hono();

apiRouter.route('', controlRouter);
apiRouter.route('', llmRouter);
