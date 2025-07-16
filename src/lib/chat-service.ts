import { db } from '../../lib/db'
import { users, chats, messages, messageVotes, suggestedActions, analytics } from '../../lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { User, Chat, Message, MessageVote, SuggestedAction, Analytics } from '../../lib/db/schema'

export class ChatService {
  // User management
  async createUser(userData: {
    email: string
    name?: string
    role: string
    customRole?: string
    topic: string
    customTopic?: string
    identification: string
    dataAccess: string[]
    microsoftSession?: {
      name?: string
      email?: string
      accessToken?: string
    }
  }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning()
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user || null
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return user
  }

  // Chat management
  async createChat(userId: string, title: string): Promise<Chat> {
    const [chat] = await db.insert(chats).values({
      userId,
      title,
      visibility: 'private'
    }).returning()
    return chat
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt))
  }

  async getChat(chatId: string): Promise<Chat | null> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    return chat || null
  }

  async updateChatTitle(chatId: string, title: string): Promise<Chat> {
    const [chat] = await db
      .update(chats)
      .set({ title, updatedAt: new Date() })
      .where(eq(chats.id, chatId))
      .returning()
    return chat
  }

  async deleteChat(chatId: string): Promise<void> {
    await db.delete(chats).where(eq(chats.id, chatId))
  }

  // Message management
  async createMessage(messageData: {
    chatId: string
    role: 'user' | 'assistant'
    content: string
    metadata?: {
      model?: string
      tokensUsed?: number
      hadCiviCRMData?: boolean
      hadKnowledgeBase?: boolean
      responseTime?: number
    }
  }): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning()
    return message
  }

  async getChatMessages(chatId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt)
  }

  async getMessage(messageId: string): Promise<Message | null> {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1)
    return message || null
  }

  // Message voting
  async voteOnMessage(messageId: string, userId: string, vote: 'up' | 'down', feedback?: string): Promise<MessageVote> {
    // Check if user already voted on this message
    const existingVote = await db
      .select()
      .from(messageVotes)
      .where(and(eq(messageVotes.messageId, messageId), eq(messageVotes.userId, userId)))
      .limit(1)

    if (existingVote.length > 0) {
      // Update existing vote
      const [updatedVote] = await db
        .update(messageVotes)
        .set({ vote, feedback })
        .where(eq(messageVotes.id, existingVote[0].id))
        .returning()
      return updatedVote
    } else {
      // Create new vote
      const [newVote] = await db
        .insert(messageVotes)
        .values({ messageId, userId, vote, feedback })
        .returning()
      return newVote
    }
  }

  async getMessageVotes(messageId: string): Promise<MessageVote[]> {
    return await db
      .select()
      .from(messageVotes)
      .where(eq(messageVotes.messageId, messageId))
  }

  async getUserVote(messageId: string, userId: string): Promise<MessageVote | null> {
    const [vote] = await db
      .select()
      .from(messageVotes)
      .where(and(eq(messageVotes.messageId, messageId), eq(messageVotes.userId, userId)))
      .limit(1)
    return vote || null
  }

  // Suggested actions
  async createSuggestedAction(actionData: {
    messageId: string
    action: string
    description?: string
    category?: string
  }): Promise<SuggestedAction> {
    const [suggestedAction] = await db.insert(suggestedActions).values(actionData).returning()
    return suggestedAction
  }

  async getMessageSuggestedActions(messageId: string): Promise<SuggestedAction[]> {
    return await db
      .select()
      .from(suggestedActions)
      .where(eq(suggestedActions.messageId, messageId))
  }

  async completeSuggestedAction(actionId: string): Promise<SuggestedAction> {
    const [action] = await db
      .update(suggestedActions)
      .set({ isCompleted: true })
      .where(eq(suggestedActions.id, actionId))
      .returning()
    return action
  }

  // Analytics
  async createAnalytics(analyticsData: {
    userId?: string
    chatId?: string
    messageId?: string
    model: string
    tokensUsed?: number
    responseTime?: number
    userRole: string
    hadCiviCRMData?: boolean
    hadKnowledgeBase?: boolean
  }): Promise<Analytics> {
    const [analytics] = await db.insert(analytics).values(analyticsData).returning()
    return analytics
  }

  async getAnalytics(filters: {
    userId?: string
    chatId?: string
    dateFrom?: Date
    dateTo?: Date
  } = {}): Promise<Analytics[]> {
    let query = db.select().from(analytics)
    
    // Apply filters (simplified - would need more complex filtering logic)
    if (filters.userId) {
      query = query.where(eq(analytics.userId, filters.userId))
    }
    
    return await query.orderBy(desc(analytics.createdAt))
  }

  // Utility methods
  async generateChatTitle(firstMessage: string): Promise<string> {
    // Simple title generation - could be enhanced with AI
    const words = firstMessage.split(' ').slice(0, 6).join(' ')
    return words.length > 50 ? words.substring(0, 50) + '...' : words
  }

  async getChatWithMessages(chatId: string): Promise<(Chat & { messages: Message[] }) | null> {
    const chat = await this.getChat(chatId)
    if (!chat) return null

    const chatMessages = await this.getChatMessages(chatId)
    return { ...chat, messages: chatMessages }
  }

  async getRecentChatsWithPreview(userId: string, limit: number = 10): Promise<(Chat & { lastMessage?: Message })[]> {
    const userChats = await this.getUserChats(userId)
    const chatsWithPreview = await Promise.all(
      userChats.slice(0, limit).map(async (chat) => {
        const lastMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.chatId, chat.id))
          .orderBy(desc(messages.createdAt))
          .limit(1)
        
        return {
          ...chat,
          lastMessage: lastMessage[0] || undefined
        }
      })
    )
    
    return chatsWithPreview
  }
}

export const chatService = new ChatService()