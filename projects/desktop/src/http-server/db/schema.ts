import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { uniqueIndex, integer, primaryKey, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { ChatHistoryItem } from 'node-llama-cpp';
import { createId } from '@paralleldrive/cuid2';

/**
 * `Date`s can not be saved in JSON fields.
 */

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
      quantitativeThesholds?: string;
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

export const llmConfigLocalLlamaOptions = ['Llama 3 8B Instruct Q2 K', 'Llama 3 8B Instruct Q8 0'] as const;
export type LlmConfigLocalLlamaOption = typeof llmConfigLocalLlamaOptions[number];
export const llmConfigAzureOpenAiOptions = ['Azure OpenAI ChatGPT 4'] as const;
export type LlmConfigAzureOpenAiOption = typeof llmConfigAzureOpenAiOptions[number];
export type LlmConfigOption = LlmConfigLocalLlamaOption | LlmConfigAzureOpenAiOption;

export const llmConfigTypes = ['LOCAL_LLAMA_V1', 'AZURE_OPENAI_V1'] as const;
export type LlmConfigType = typeof llmConfigTypes[number];

export interface BaseLlmConfigSchema {
  schemaVersion: number;
  value: {
    type: Extract<LlmConfigType, 'LOCAL_LLAMA_V1'>;
    fileName: string;
  } | {
    type: Extract<LlmConfigType, 'AZURE_OPENAI_V1'>;
    apiKey: string;
    endpoint: string;
  };
};

export interface LlmConfigSchemaV1 extends BaseLlmConfigSchema {
  schemaVersion: 1;
}

export const llmConfigsTable = sqliteTable('llm_configs',
  {
    id: integer('id')
      .primaryKey(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .$default(() => new Date())
      .notNull(),
    option: text('option')
      .notNull(),
    isActive: integer('is_active', { mode: 'boolean' })
      .default(false)
      .notNull(),
    document: text('value', { mode: 'json' })
      .$type<LlmConfigSchemaV1>()
      .notNull(),
  },
);

////////////////////////////////////////////////////////////////////////////////

export interface BaseUserSchema {
  schemaVersion: number;
  value: {
    settings: {
      termsOfServiceAcceptedOn?: string;
    }
  };
};

export interface UserSchemaV1 extends BaseUserSchema {
  schemaVersion: 1;
}

export enum Role {
  User = 'USER',
  Admin = 'ADMIN',
}

export const usersTable = sqliteTable('users',
  {
    id: integer('id')
      .primaryKey(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .$default(() => new Date())
      .notNull(),
    document: text('value', { mode: 'json' })
      .$type<UserSchemaV1>()
      .notNull(),
    publicId: text('public_id')
      .notNull()
      .$default(() => createId()),
    email: text('email')
      .notNull()
      .unique(),
    passwordHash: text('password_hash')
      .notNull(),
    role: text('role', { enum: (Object.values(Role) as [string, ...string[]]) })
      .default(Role.User)
      .notNull(),
    isEmailVerified: integer('is_email_verified', { mode: 'boolean' })
      .default(false)
      .notNull(),
    emailVerificationCode: text('email_verification_code'),
    emailVerificationCodeExpiry: integer('email_verification_code_expiry', { mode: 'timestamp' }),
  },
  (table) => {
    return {
      publicIdIdx: uniqueIndex('users_public_id_idx').on(table.publicId),
      emailIdx: uniqueIndex('users_email_idx').on(table.email),
    };
  }
);

////////////////////////////////////////////////////////////////////////////////

export type Control = InferSelectModel<typeof controlsTable>;
export type ControlInsertModel = InferInsertModel<typeof controlsTable>;

export type Chat = InferSelectModel<typeof chatsTable>;
export type ChatInsertModel = InferInsertModel<typeof chatsTable>;

export type ControlsToChats = InferSelectModel<typeof controlsToChatsTable>;
export type ControlsToChatsInsertModel = InferInsertModel<typeof controlsToChatsTable>;

export type LlmConfig = InferSelectModel<typeof llmConfigsTable>;
export type LLmConfigInsertModel = InferInsertModel<typeof llmConfigsTable>;

export type User = InferSelectModel<typeof usersTable>;
