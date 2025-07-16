import { pgTable, uuid, text, timestamp, varchar, json, boolean, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull(),
  customRole: text('custom_role'),
  topic: varchar('topic', { length: 50 }).notNull(),
  customTopic: text('custom_topic'),
  identification: varchar('identification', { length: 50 }).notNull(),
  dataAccess: json('data_access').$type<string[]>().notNull(),
  microsoftSession: json('microsoft_session').$type<{
    name?: string
    email?: string
    accessToken?: string
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  visibility: varchar('visibility', { length: 10 }).default('private').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  metadata: json('metadata').$type<{
    model?: string
    tokensUsed?: number
    hadCiviCRMData?: boolean
    hadKnowledgeBase?: boolean
    responseTime?: number
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const messageVotes = pgTable('message_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vote: varchar('vote', { length: 10 }).notNull(), // 'up' or 'down'
  feedback: text('feedback'), // Optional feedback text
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const suggestedActions = pgTable('suggested_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }), // 'follow-up', 'template', 'next-step'
  isCompleted: boolean('is_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const analytics = pgTable('analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }),
  model: varchar('model', { length: 50 }).notNull(),
  tokensUsed: integer('tokens_used'),
  responseTime: integer('response_time'), // milliseconds
  userRole: varchar('user_role', { length: 50 }).notNull(),
  hadCiviCRMData: boolean('had_civicrm_data').default(false),
  hadKnowledgeBase: boolean('had_knowledge_base').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  messageVotes: many(messageVotes),
  analytics: many(analytics),
}))

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  messages: many(messages),
  analytics: many(analytics),
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  votes: many(messageVotes),
  suggestedActions: many(suggestedActions),
  analytics: many(analytics),
}))

export const messageVotesRelations = relations(messageVotes, ({ one }) => ({
  message: one(messages, { fields: [messageVotes.messageId], references: [messages.id] }),
  user: one(users, { fields: [messageVotes.userId], references: [users.id] }),
}))

export const suggestedActionsRelations = relations(suggestedActions, ({ one }) => ({
  message: one(messages, { fields: [suggestedActions.messageId], references: [messages.id] }),
}))

export const analyticsRelations = relations(analytics, ({ one }) => ({
  user: one(users, { fields: [analytics.userId], references: [users.id] }),
  chat: one(chats, { fields: [analytics.chatId], references: [chats.id] }),
  message: one(messages, { fields: [analytics.messageId], references: [messages.id] }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type MessageVote = typeof messageVotes.$inferSelect
export type NewMessageVote = typeof messageVotes.$inferInsert
export type SuggestedAction = typeof suggestedActions.$inferSelect
export type NewSuggestedAction = typeof suggestedActions.$inferInsert
export type Analytics = typeof analytics.$inferSelect
export type NewAnalytics = typeof analytics.$inferInsert