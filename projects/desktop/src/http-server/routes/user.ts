import { Hono } from 'hono';
import { db } from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const userRouter = new Hono();

userRouter.get('/user',
  async (c) => {
    let user = await db.query.usersTable.findFirst();

    if (!user) {
      user = await db.insert(usersTable)
        .values({
          email: '',
          passwordHash: '',
          document: {
            schemaVersion: 1,
            value: {
              settings: {
              },
            },
          },
        }).returning().get();
    }

    return c.json(user);
  }
);

userRouter.post('/user/accept-tos',
  async (c) => {
    const date = new Date();
    const user = await db.query.usersTable.findFirst();

    if (!user) {
      const user = await db.insert(usersTable)
        .values({
          email: '',
          passwordHash: '',
          document: {
            schemaVersion: 1,
            value: {
              settings: {
                termsOfServiceAcceptedOn: date.toISOString(),
              },
            },
          },
        }).returning().get();
      return c.json(user);
    }

    const updatedUser = await db.update(usersTable)
      .set({
        document: {
          ...user.document,
          value: {
            ...user.document.value,
            settings: {
              termsOfServiceAcceptedOn: date.toISOString(),
            },
          },
        },
      })
      .where(eq(usersTable.id, user.id))
      .returning().get();

    return c.json(updatedUser);
  }
);
