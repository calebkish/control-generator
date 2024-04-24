import { InferSelectModel } from 'drizzle-orm';
import { uniqueIndex, integer, primaryKey, real, sqliteTable, text, unique, blob } from 'drizzle-orm/sqlite-core';

interface BaseControlSchema {
  schemaVersion: number;
  type: string;
  ipe: string[];
  frequency: string;
  judgements: string[];
  quantitativeThesholds: string[];
  qualitativeThresholds: string[];
  investigationProcess: string;
  description: string;
};

interface ControlSchemaV1 extends BaseControlSchema {
  schemaVersion: 1;
}

////////////////////////////////////////////////////////////////////////////////

export const controlsTable = sqliteTable('controlsTable', {
  id: integer('id')
    .primaryKey({ autoIncrement: true }),
  // rowVersion: integer('row_version')
  //   .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .$default(() => new Date())
    .notNull(),
  name: text('name')
    .notNull(),
  value: blob('value', { mode: 'json' })
    .$type<ControlSchemaV1>()
    .notNull(),
});

////////////////////////////////////////////////////////////////////////////////

export type Control = InferSelectModel<typeof controlsTable>;
