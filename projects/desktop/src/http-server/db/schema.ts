import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { uniqueIndex, integer, primaryKey, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { ChatHistoryItem } from 'node-llama-cpp';

////////////////////////////////////////////////////////////////////////////////

interface BaseControlSchema {
  schemaVersion: number;
  value : {
    form: {
      name: string;
      generalProcessCategory?: string;
      objective?: string;
      type?: string;
      frequency?: string;

      ipc?: string;
      judgement?: string;
      quantitativeThesholds?: number;
      qualitativeThresholds?: string;
      investigationProcess?: string;

      description?: string;
      attributeRoadmap?: string;
      attributes?: string[];
    };
  };
};

export interface ControlSchemaV1 extends BaseControlSchema {
  schemaVersion: 1;
}

export const controlsTable = sqliteTable('controls', {
  id: integer('id')
    .primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$default(() => new Date())
    .notNull(),
  name: text('name')
    .unique()
    .notNull(),
  document: text('value', { mode: 'json' })
    .$type<ControlSchemaV1>()
    .notNull(),
});

export const controlsRelations = relations(controlsTable, ({ many }) => ({
  controlsToChats: many(controlsToChatsTable),
}));

////////////////////////////////////////////////////////////////////////////////

export interface BaseChatSchema {
  schemaVersion: number;
  value: {
    systemPrompt: string;
    history: ChatHistoryItem[];
  };
};

export interface ChatSchemaV1 extends BaseChatSchema {
  schemaVersion: 1;
}

export const chatsTable = sqliteTable('chats', {
  id: integer('id')
    .primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$default(() => new Date())
    .notNull(),
  document: text('value', { mode: 'json' })
    .$type<ChatSchemaV1>()
    .notNull(),
});

export const chatsRelations = relations(chatsTable, ({ many }) => ({
  controlsToChats: many(controlsToChatsTable),
}));

////////////////////////////////////////////////////////////////////////////////

export enum ControlChatType {
  Description = 'description',
  AttributesRoadmap = 'attributesRoadmap',
  Attributes = 'attributes',
};

export const controlsToChatsTable = sqliteTable('controls_to_chats',
  {
    controlId: integer('control_id').notNull().references(() => controlsTable.id, { onDelete: 'cascade' }),
    chatId: integer('chat_id').notNull().references(() => chatsTable.id, { onDelete: 'cascade' }),
    chatType: text('type', { enum: (Object.values(ControlChatType) as [string, ...string[]]) }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.controlId, t.chatId] }),
  }),
);

export const controlsToChatsRelations = relations(controlsToChatsTable, ({ one }) => ({
  control: one(controlsTable, {
    fields: [controlsToChatsTable.controlId],
    references: [controlsTable.id],
  }),
  chat: one(chatsTable, {
    fields: [controlsToChatsTable.chatId],
    references: [chatsTable.id],
  }),
}));

////////////////////////////////////////////////////////////////////////////////

export type Control = InferSelectModel<typeof controlsTable>;
export type ControlInsertModel = InferInsertModel<typeof controlsTable>;

export type Chat = InferSelectModel<typeof chatsTable>;
export type ChatInsertModel = InferInsertModel<typeof chatsTable>;

export type ControlsToChats = InferSelectModel<typeof controlsToChatsTable>;
export type ControlsToChatsInsertModel = InferInsertModel<typeof controlsToChatsTable>;
