import {
  integer,
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  password: text().notNull(),
  publicKey: text().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp().defaultNow().notNull(),
  data: jsonb().notNull(),
  senderId: integer()
    .notNull()
    .references(() => usersTable.id),
  receiverId: integer()
    .notNull()
    .references(() => usersTable.id),
});
