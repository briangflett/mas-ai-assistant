'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, User, Bot, AlertCircle, Copy, Check, ThumbsUp, ThumbsDown, MessageSquare, Plus, Search, Trash2, MessageCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { chatService } from '../lib/chat-service'
// import { MessageActions } from './message-actions'
import type { User as DbUser, Chat, Message as DbMessage } from '../../lib/db/schema'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  metadata?: {
    model?: string
    tokensUsed?: number
    hadCiviCRMData?: boolean
    hadKnowledgeBase?: boolean
  }
}

interface UserProfile {
  role: string
  customRole?: string
  topic: string
  customTopic?: string
  identification: string
  email?: string
  dataAccess: string[]
  microsoftSession?: {
    name?: string
    email?: string
    accessToken?: string
  } | null
}

export function ChatInterfaceEnhanced() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<DbUser | null>(null)
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const profile = localStorage.getItem('userProfile')
    if (profile) {
      const parsedProfile = JSON.parse(profile)
      setUserProfile(parsedProfile)
      initializeUser(parsedProfile)
    } else {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeUser = async (profile: UserProfile) => {
    try {
      const email = profile.email || profile.microsoftSession?.email
      if (!email) return

      // Fallback user for demo purposes when database is not connected
      const fallbackUser = {
        id: 'demo-user-id',
        email,
        name: profile.microsoftSession?.name || 'Demo User',
        role: profile.role,
        customRole: profile.customRole,
        topic: profile.topic,
        customTopic: profile.customTopic,
        identification: profile.identification,
        dataAccess: profile.dataAccess || ['public'],
        microsoftSession: profile.microsoftSession,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setUser(fallbackUser)
      
      // Try to connect to database, fall back to demo mode if it fails
      try {
        let dbUser = await chatService.getUserByEmail(email)
        
        if (!dbUser) {
          dbUser = await chatService.createUser({
            email,
            name: profile.microsoftSession?.name,
            role: profile.role,
            customRole: profile.customRole,
            topic: profile.topic,
            customTopic: profile.customTopic,
            identification: profile.identification,
            dataAccess: profile.dataAccess || ['public'],
            microsoftSession: profile.microsoftSession
          })
        }

        setUser(dbUser)
        loadChats(dbUser.id)
        return
      } catch (dbError) {
        // Silently fall back to demo mode - this is expected when no database is configured
      }
      
      // Running in demo mode
      // Create a demo chat for demonstration
      const demoChat = {
        id: 'demo-chat-id',
        title: 'Demo Conversation',
        userId: fallbackUser.id,
        visibility: 'private' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setCurrentChat(demoChat)
      setChats([demoChat])
      
      // Add demo welcome message
      const welcomeMessage = await addWelcomeMessage(demoChat.id)
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Failed to initialize user:', error)
    }
  }

  const loadChats = async (userId: string) => {
    try {
      const userChats = await chatService.getUserChats(userId)
      setChats(userChats)
      
      // If no current chat, create one or use the most recent
      if (!currentChat) {
        if (userChats.length > 0) {
          setCurrentChat(userChats[0])
          loadChatMessages(userChats[0].id)
        } else {
          createNewChat(userId)
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  }

  const createNewChat = async (userId: string) => {
    try {
      const newChat = await chatService.createChat(userId, 'New Conversation')
      setCurrentChat(newChat)
      setChats(prev => [newChat, ...prev])
      setMessages([])
      
      // Add welcome message
      const welcomeMessage = await addWelcomeMessage(newChat.id)
      setMessages([welcomeMessage])
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  const loadChatMessages = async (chatId: string) => {
    try {
      const chatMessages = await chatService.getChatMessages(chatId)
      const formattedMessages = chatMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.createdAt),
        metadata: msg.metadata
      }))
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to load chat messages:', error)
    }
  }

  const addWelcomeMessage = async (chatId: string): Promise<Message> => {
    const getRoleDisplay = () => {
      if (userProfile?.role === 'other') {
        return userProfile.customRole || 'Other'
      }
      const roleMap = {
        'mas-client': 'MAS Client',
        'mas-staff-vc': 'MAS Staff/Volunteer Consultant',
        'canadian-charity': 'Canadian Charity Team Member'
      }
      return roleMap[userProfile?.role as keyof typeof roleMap] || userProfile?.role
    }

    const getTopicDisplay = () => {
      return userProfile?.topic === 'Other' ? userProfile.customTopic || 'Other' : userProfile?.topic
    }

    const welcomeContent = `Hello! I'm your MAS AI Assistant. I see you're interested in ${getTopicDisplay()} and you're a ${getRoleDisplay()}. I have access to ${userProfile?.dataAccess?.join(', ')} data to help you. What would you like to work on today?`

    try {
      const dbMessage = await chatService.createMessage({
        chatId,
        role: 'assistant',
        content: welcomeContent,
        metadata: {
          model: 'system',
          hadCiviCRMData: false,
          hadKnowledgeBase: false
        }
      })

      return {
        id: dbMessage.id,
        content: welcomeContent,
        sender: 'assistant',
        timestamp: new Date(dbMessage.createdAt),
        metadata: dbMessage.metadata
      }
    } catch (error) {
      console.error('Failed to save welcome message:', error)
      return {
        id: 'welcome-' + Date.now(),
        content: welcomeContent,
        sender: 'assistant',
        timestamp: new Date()
      }
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentChat || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Save user message to database
      await chatService.createMessage({
        chatId: currentChat.id,
        role: 'user',
        content: inputMessage
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            userProfile,
            previousMessages: messages.slice(-5)
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date(),
        metadata: {
          model: data.model || 'unknown',
          tokensUsed: data.tokensUsed,
          hadCiviCRMData: data.hadCiviCRMData,
          hadKnowledgeBase: data.hadKnowledgeBase
        }
      }

      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message to database
      await chatService.createMessage({
        chatId: currentChat.id,
        role: 'assistant',
        content: data.response,
        metadata: assistantMessage.metadata
      })

      // Update chat title if it's the first user message
      if (messages.length <= 1) {
        const title = await chatService.generateChatTitle(inputMessage)
        await chatService.updateChatTitle(currentChat.id, title)
        setCurrentChat(prev => prev ? { ...prev, title } : null)
        setChats(prev => prev.map(chat => 
          chat.id === currentChat.id ? { ...chat, title } : chat
        ))
      }

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>')
  }

  const handleChatSelect = (chat: Chat) => {
    setCurrentChat(chat)
    loadChatMessages(chat.id)
  }

  const handleDeleteChat = async (chatId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await chatService.deleteChat(chatId)
        setChats(prev => prev.filter(chat => chat.id !== chatId))
        
        if (currentChat?.id === chatId) {
          const remainingChats = chats.filter(chat => chat.id !== chatId)
          if (remainingChats.length > 0) {
            handleChatSelect(remainingChats[0])
          } else if (user) {
            createNewChat(user.id)
          }
        }
      } catch (error) {
        console.error('Failed to delete chat:', error)
      }
    }
  }

  const handleMessageVote = async (messageId: string, vote: 'up' | 'down', feedback?: string) => {
    if (!user) return
    
    try {
      await chatService.voteOnMessage(messageId, user.id, vote, feedback)
      console.log(`Voted ${vote} on message ${messageId}${feedback ? ` with feedback: ${feedback}` : ''}`)
    } catch (error) {
      console.log(`Demo mode: Would vote ${vote} on message ${messageId}${feedback ? ` with feedback: ${feedback}` : ''}`)
    }
  }

  const resetProfile = () => {
    localStorage.removeItem('userProfile')
    router.push('/')
  }

  if (!userProfile || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              <Button
                onClick={() => user && createNewChat(user.id)}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredChats.map((chat) => (
              <Card
                key={chat.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  currentChat?.id === chat.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleChatSelect(chat)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 truncate text-sm">
                          {chat.title}
                        </h3>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteChat(chat.id)
                      }}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MAS AI Assistant</h1>
                <div className="text-sm text-gray-600">
                  {userProfile.role === 'other' ? userProfile.customRole : userProfile.role} • {userProfile.topic === 'Other' ? userProfile.customTopic : userProfile.topic}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {userProfile.dataAccess.map((access) => (
                  <Badge key={access} variant="secondary" className="text-xs">
                    {access}
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetProfile}
                className="text-gray-500 hover:text-gray-700"
              >
                Change Profile
              </Button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-lg px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      message.sender === 'user' ? 'bg-blue-500' : 'bg-gray-100'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(message.content)
                        }}
                      />
                      
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                        {message.metadata?.model && (
                          <span className="ml-2">• {message.metadata.model}</span>
                        )}
                      </div>
                      
                      {message.sender === 'assistant' && (
                        <div className="mt-3 flex items-center space-x-2">
                          <button
                            onClick={() => handleMessageVote(message.id, 'up')}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Helpful</span>
                          </button>
                          <button
                            onClick={() => handleMessageVote(message.id, 'down')}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <ThumbsDown className="w-3 h-3" />
                            <span>Not Helpful</span>
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3xl bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
                autoFocus
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage(`Help me with ${userProfile.topic === 'Other' ? userProfile.customTopic : userProfile.topic}`)}
              >
                {userProfile.topic === 'Other' ? userProfile.customTopic : userProfile.topic}
              </Button>
              {userProfile.role === 'mas-staff-vc' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('What are my active projects?')}
                  >
                    My Projects
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('Show me VC templates')}
                  >
                    VC Templates
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage('What can you help me with?')}
              >
                Get Help
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}