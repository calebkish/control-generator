import { z } from 'zod';
import { Hono } from 'hono';
import { ControlChatType, ControlInsertModel, ControlSchemaV1, chatsTable, controlsTable, controlsToChatsTable } from '../db/schema.js';
import { db } from '../db/index.js';
import { and, eq } from 'drizzle-orm';
import { ControlChatResponse } from '../models/index.js';

export const controlRouter = new Hono();

controlRouter.get('/controls',
  async (c) => {
    const controls = await db.query.controlsTable.findMany();
    return c.json(controls);
  },
);

controlRouter.get('/controls/:id',
  async (c) => {
    const id = c.req.param('id');
    const idNum = parseInt(id);
    if (Number.isNaN(idNum)) {
      return c.json({ success: false }, 400);
    }

    const control = await db.query.controlsTable.findFirst({
      where: eq(controlsTable.id, idNum),
      with: {
        controlsToChats: {
          with: {
            chat: true
          },
        },
      },
    });

    if (!control) {
      return c.notFound();
    }

    return c.json(control);
  }
);

const upsertControlValidator = z.object({
  name: z.string(),
  generalProcessCategory: z.string().optional(),
  objective: z.string().optional(),
  type: z.string().optional(),
  frequency: z.string().optional(),

  ipc: z.string().optional(),
  judgement: z.string().optional(),
  quantitativeThesholds: z.number().optional(),
  qualitativeThresholds: z.string().optional(),
  investigationProcess: z.string().optional(),
  description: z.string().optional(),
  attributeRoadmap: z.string().optional(),
  attributes: z.array(z.string()).optional(),
});
controlRouter.post('/controls',
  async (c) => {
    const unparsed = await c.req.json();
    const parsed = await upsertControlValidator.spa(unparsed);

    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const body = parsed.data;

    const toInsert: ControlInsertModel = {
      name: body.name,
      document: {
        schemaVersion: 1,
        value: {
          form: {
            name: body.name,
            generalProcessCategory: body.generalProcessCategory,
            objective: body.objective,
            type: body.type,
            ipc: body.ipc,
            frequency: body.frequency,
            judgement: body.judgement,
            quantitativeThesholds: body.quantitativeThesholds,
            qualitativeThresholds: body.qualitativeThresholds,
            investigationProcess: body.investigationProcess,
          },
        },
      },
    };

    try {
      const control = await db.insert(controlsTable)
        .values(toInsert)
        .returning().get();
      return c.json({ success: true, control }, 201);
    } catch (error) {
      console.error('Failed to insert control');
      console.error(error);
      const zodError = new z.ZodError([{
        code: 'custom',
        message: 'Save failed!',
        path: [],
      }]);
      return c.json(zodError.flatten(), 400);
    }
  },
);

const patchControlValidator = upsertControlValidator.extend({
  name: z.string().optional()
});
controlRouter.patch('/controls/:id',
  async (c) => {
    const id = c.req.param('id');
    const idNum = parseInt(id);
    if (Number.isNaN(idNum)) {
      return c.json({ success: false }, 400);
    }

    const control = await db.query.controlsTable.findFirst({
      where: eq(controlsTable.id, idNum),
      with: {
        controlsToChats: {
          with: {
            chat: true
          },
        },
      },
    });

    if (!control) {
      return c.notFound();
    }

    const unparsed = await c.req.json();
    const parsed = await patchControlValidator.spa(unparsed);

    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const body = parsed.data;

    const newDocument: ControlSchemaV1 = {
      ...control.document,
      value: {
        ...control.document.value,
        form: {
          ...control.document.value.form,
          ...body,
        },
      },
    };

    await db.update(controlsTable)
      .set({
        name: body.name,
        document: newDocument,
      })
      .where(eq(controlsTable.id, idNum));

    return c.json({ success: true });
  },
);

// controlRouter.get('/controls/:controlId/chat/:type',
//   async (c) => {
//     const controlId = c.req.param('controlId');
//     const controlIdNum = parseInt(controlId);
//     if (Number.isNaN(controlIdNum)) {
//       return c.json({ success: false }, 400);
//     }

//     const type = c.req.param('type');
//     if (!isControlChatType(type)) {
//       return c.json({ success: false }, 400);
//     }

//     const ctc = await db.query.controlsToChatsTable.findFirst({
//       where: and(
//         eq(controlsToChatsTable.controlId, controlIdNum),
//         eq(controlsToChatsTable.chatType, type),
//       ),
//       with: {
//         chat: true,
//       },
//     });

//     if (!ctc) {
//       return c.notFound();
//     }

//     const vm: ControlChatResponse = {
//       chatId: ctc.chatId,
//       document: ctc.chat.document,
//       type: ctc.chatType,
//     };
//     return c.json(vm);
//   },
// );

// const putControlChatValidator = z.object({
//   systemPrompt: z.string(),
// });

controlRouter.put('/controls/:controlId/chat/:type',
  async (c) => {
    const controlId = c.req.param('controlId');
    const controlIdNum = parseInt(controlId);
    if (Number.isNaN(controlIdNum)) {
      return c.json({ success: false }, 400);
    }

    const type = c.req.param('type');
    if (!isControlChatType(type)) {
      return c.json({ success: false }, 400);
    }

    // const unparsed = await c.req.json();
    // const parsed = await putControlChatValidator.spa(unparsed);
    // if (!parsed.success) {
    //   return c.json({ success: false }, 400);
    // }

    const vm = await putControlChat(controlIdNum, type)

    if (!vm) {
      return c.notFound();
    }
    return c.json(vm);
  },
);

controlRouter.delete('/controls/:controlId',
  async (c) => {
    const controlId = c.req.param('controlId');
    const controlIdNum = parseInt(controlId);
    if (Number.isNaN(controlIdNum)) {
      return c.json({ success: false }, 400);
    }

    const control = await db.query.controlsTable.findFirst({
      where: eq(controlsTable.id, controlIdNum),
    });

    if (!control) {
      return c.notFound();
    }

    await db.delete(controlsTable)
      .where(eq(controlsTable.id, control.id));

    return c.json({ success: true });
  },
);

function isControlChatType(str: string): str is ControlChatType {
  return Object.values(ControlChatType).includes(str as ControlChatType);
}

async function putControlChat(controlIdNum: number, type: string): Promise<ControlChatResponse | null> {
  const control = await db.query.controlsTable.findFirst({
    where: eq(controlsTable.id, controlIdNum),
    with: {
      controlsToChats: {
        where: and(
          eq(controlsToChatsTable.controlId, controlIdNum),
          eq(controlsToChatsTable.chatType, type),
        ),
        with: {
          chat: true
        },
      },
    },
  });

  if (!control) {
    return null;
  }

  const ctc = control.controlsToChats.find(ctc => ctc.chatType === type);

  if (ctc) {
    const vm: ControlChatResponse = {
      chatId: ctc.chat.id,
      controlId: control.id,
      controlForm: control.document.value.form,
      history: ctc.chat.document.value.history,
      type: ctc.chatType,
    };
    return vm;
  }

  const chatVm: ControlChatResponse = await db.transaction(async (tx) => {
    const chat = await tx.insert(chatsTable)
      .values([
        {
          document: {
            schemaVersion: 1,
            value: {
              systemPrompt: '',
              history: [],
            },
          },
        },
      ]).returning().get();

    await tx.insert(controlsToChatsTable)
      .values([
        {
          chatId: chat.id,
          chatType: type,
          controlId: controlIdNum,
        },
      ]);

    const vm: ControlChatResponse = {
      chatId: chat.id,
      controlId: control.id,
      controlForm: control.document.value.form,
      history: chat.document.value.history,
      type: type,
    };
    return vm;
  });
  return chatVm;
}
