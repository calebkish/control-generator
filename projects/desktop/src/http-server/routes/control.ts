import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { z } from 'zod';
import { Hono } from 'hono';
import { ControlChatType, ControlInsertModel, ControlSchemaV1, chatsTable, controlsTable, controlsToChatsTable } from '../db/schema.js';
import { db } from '../db/index.js';
import { and, eq } from 'drizzle-orm';
import { ControlChatResponse } from '../models/index.js';
import PDFDocument from 'pdfkit';
import { isDevelopment } from '../../env.js';
import { appPath, userDataDir } from '../args.js';

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
  quantitativeThesholds: z.string().optional(),
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


const pdfResourcesBasePath = path.join(appPath, 'pdf-resources');

const exportControlValidator = z.object({
  path: z.string()
});
controlRouter.post('/controls/:id/export',
  async (c) => {
    const id = c.req.param('id');
    const idNum = parseInt(id);
    if (Number.isNaN(idNum)) {
      return c.json({ success: false }, 400);
    }

    const control = await db.query.controlsTable.findFirst({
      where: eq(controlsTable.id, idNum),
    });

    if (!control) {
      return c.notFound();
    }

    const unparsed = await c.req.json();
    const parsed = await exportControlValidator.spa(unparsed);

    if (!parsed.success) {
      return c.json(parsed.error.flatten(), 400);
    }

    const pathToPdf = path.join(parsed.data.path);

    const doc = new PDFDocument({ margin: 25 });
    doc.registerFont('Cantarell', path.join(pdfResourcesBasePath, 'Cantarell-Regular.ttf'));
    doc.registerFont('Cantarell Bold', path.join(pdfResourcesBasePath,'Cantarell-Bold.ttf'));

    doc.font('Cantarell');

    doc.pipe(fs.createWriteStream(pathToPdf));
    doc.image(path.join(pdfResourcesBasePath, 'soxai-logo.png'), {
      fit: [50, 50],
      align: 'center',
      valign: 'center',
    });

    doc
      .font('Cantarell Bold')
      .fontSize(14)
      .text('SOX AI', 80, 40);

    const {
      generalProcessCategory, type, ipc, frequency, objective,
      judgement, quantitativeThesholds, qualitativeThresholds,
      investigationProcess, attributes
    } = control.document.value.form;

    let controlText = `Control Name: ${control.name}`;

    if (generalProcessCategory) {
      controlText += `\n\nGPC: ${generalProcessCategory}`;
    }
    if (type) {
      controlText += `\n\nNature of Control: ${type}`;
    }
    if (ipc) {
      controlText += `\n\nIPC: ${ipc}`;
    }
    if (frequency) {
      controlText += `\n\nFrequency: ${frequency}`;
    }
    if (objective) {
      controlText += `\n\nObjective: ${objective}`;
    }
    if (judgement) {
      controlText += `\n\nJudgement: ${judgement}`;
    }
    if (quantitativeThesholds) {
      controlText += `\n\nQuantitative Thresholds: ${quantitativeThesholds}`;
    }
    if (qualitativeThresholds) {
      controlText += `\n\nQualitative Thresholds: ${qualitativeThresholds}`;
    }
    if (investigationProcess) {
      controlText += `\n\nInvestation and Resolution Process: ${investigationProcess}`;
    }

    doc
      .font('Cantarell')
      .fontSize(11)
      .text(controlText, 25, 80);

    if (attributes && attributes.length > 0) {
      doc.addPage();

      doc
        .font('Cantarell Bold')
        .fontSize(14)
        .text(`Attributes`);

      let attributesText = '';
      for (const attribute of attributes) {
        attributesText += `\n\n${attribute}`;
      }

      doc
        .font('Cantarell')
        .fontSize(11)
        .text(attributesText);
    }
    doc.end();

    return c.json({ success: true });
  }
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
