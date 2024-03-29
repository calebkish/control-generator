import { Hono } from 'hono'
import { db } from '../db/index.js';
import { controlsTable } from '../db/schema.js';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

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
