'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MessageCircle, Trash2, MoreHorizontal, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { chatService } from '../lib/chat-service'
import type { Chat, Message } from '../../lib/db/schema'

interface ChatSidebarProps {
  currentChatId?: string
  userId: string
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
}

interface ChatWithPreview extends Chat {
  lastMessage?: Message
}

export function ChatSidebar({ currentChatId, userId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatWithPreview[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadChats()
  }, [userId])

  const loadChats = async () => {
    try {
      setIsLoading(true)
      const userChats = await chatService.getRecentChatsWithPreview(userId, 20)
      setChats(userChats)
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await chatService.deleteChat(chatId)
        setChats(chats.filter(chat => chat.id !== chatId))
        
        // If we're deleting the current chat, navigate to a new one
        if (currentChatId === chatId) {
          onNewChat()
        }
      } catch (error) {
        console.error('Failed to delete chat:', error)
      }
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: string) => {
    const chatDate = new Date(date)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return chatDate.toLocaleDateString()
  }

  const truncateContent = (content: string, maxLength: number = 60) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  return (
    <div className=\"w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full\">
      {/* Header */}
      <div className=\"p-4 border-b border-gray-200\">
        <div className=\"flex items-center justify-between mb-4\">
          <h2 className=\"text-lg font-semibold text-gray-900\">Conversations</h2>
          <Button
            onClick={onNewChat}
            size=\"sm\"
            className=\"flex items-center space-x-2\"
          >
            <Plus className=\"w-4 h-4\" />
            <span>New</span>
          </Button>
        </div>
        
        {/* Search */}
        <div className=\"relative\">
          <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4\" />
          <Input
            placeholder=\"Search conversations...\"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className=\"pl-10\"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className=\"flex-1 overflow-y-auto p-4 space-y-2\">
        {isLoading ? (
          <div className=\"space-y-3\">
            {[...Array(5)].map((_, i) => (
              <div key={i} className=\"animate-pulse\">
                <div className=\"bg-gray-200 rounded-lg p-3 space-y-2\">
                  <div className=\"h-4 bg-gray-300 rounded w-3/4\"></div>
                  <div className=\"h-3 bg-gray-300 rounded w-1/2\"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className=\"text-center py-8 text-gray-500\">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <Card
              key={chat.id}
              className={`cursor-pointer transition-all hover:shadow-sm ${
                currentChatId === chat.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <CardContent className=\"p-3\">
                <div className=\"flex items-start justify-between\">
                  <div className=\"flex-1 min-w-0\">
                    <div className=\"flex items-center space-x-2 mb-1\">
                      <MessageCircle className=\"w-4 h-4 text-gray-400 flex-shrink-0\" />
                      <h3 className=\"font-medium text-gray-900 truncate text-sm\">
                        {chat.title}
                      </h3>
                    </div>
                    
                    {chat.lastMessage && (
                      <p className=\"text-xs text-gray-500 mb-2\">
                        {truncateContent(chat.lastMessage.content)}
                      </p>
                    )}
                    
                    <div className=\"flex items-center justify-between\">
                      <Badge variant=\"secondary\" className=\"text-xs\">
                        {formatDate(chat.updatedAt)}
                      </Badge>
                      
                      {chat.visibility === 'public' && (
                        <Badge variant=\"outline\" className=\"text-xs\">
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className=\"flex items-center space-x-1 ml-2\">
                    <Button
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className=\"h-6 w-6 p-0 text-gray-400 hover:text-red-500\"
                    >
                      <Trash2 className=\"w-3 h-3\" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      <div className=\"p-4 border-t border-gray-200\">
        <div className=\"text-xs text-gray-500 text-center\">
          {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}