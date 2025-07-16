'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from 'ai/react'
import { Send, Loader2, User, Bot, AlertCircle, Copy, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

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

interface ChatInterfaceStreamProps {
  userProfile: UserProfile
}

export function ChatInterfaceStream({ userProfile }: ChatInterfaceStreamProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: '/api/chat-stream',
    body: {
      userProfile,
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
    onFinish: (message) => {
      console.log('Message finished:', message)
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getRoleDisplay = () => {
    if (userProfile.role === 'other') {
      return userProfile.customRole || 'Other'
    }
    const roleMap = {
      'mas-client': 'MAS Client',
      'mas-staff-vc': 'MAS Staff/Volunteer Consultant',
      'canadian-charity': 'Canadian Charity Team Member'
    }
    return roleMap[userProfile.role as keyof typeof roleMap] || userProfile.role
  }

  const getTopicDisplay = () => {
    return userProfile.topic === 'Other' ? userProfile.customTopic || 'Other' : userProfile.topic
  }

  const formatMessage = (content: string) => {
    // Enhanced message formatting with better markdown support
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class=\"bg-gray-100 px-1 py-0.5 rounded text-sm\">$1</code>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className=\"flex flex-col h-screen bg-gray-50\">
      {/* Header */}
      <div className=\"bg-white border-b p-4 shadow-sm\">
        <div className=\"max-w-4xl mx-auto flex items-center justify-between\">
          <div>
            <h1 className=\"text-2xl font-bold text-gray-900\">MAS AI Assistant</h1>
            <p className=\"text-sm text-gray-600\">
              {getRoleDisplay()} • {getTopicDisplay()}
            </p>
          </div>
          <div className=\"flex items-center space-x-2\">
            {userProfile.dataAccess.map((access) => (
              <Badge key={access} variant=\"secondary\" className=\"text-xs\">
                {access}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className=\"flex-1 overflow-y-auto p-4\">
        <div className=\"max-w-4xl mx-auto space-y-4\">
          {messages.length === 0 && (
            <Card className=\"bg-blue-50 border-blue-200\">
              <CardContent className=\"p-6\">
                <h3 className=\"font-semibold text-blue-900 mb-2\">Welcome!</h3>
                <p className=\"text-blue-800 mb-4\">
                  I'm here to help with nonprofit consulting, CiviCRM guidance, and organizational strategy. 
                  You can ask me about:
                </p>
                <ul className=\"text-sm text-blue-700 space-y-1\">
                  <li>• Strategic planning and governance</li>
                  <li>• Fundraising and donor relations</li>
                  <li>• Program design and evaluation</li>
                  <li>• Volunteer management</li>
                  {userProfile.role === 'mas-staff-vc' && (
                    <>
                      <li>• CiviCRM implementation and usage</li>
                      <li>• Your active projects and cases</li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className=\"flex items-start space-x-3\">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <User className=\"w-4 h-4 text-white\" />
                    ) : (
                      <Bot className=\"w-4 h-4 text-gray-600\" />
                    )}
                  </div>
                  
                  <div className=\"flex-1 min-w-0\">
                    <div
                      className=\"prose prose-sm max-w-none\"
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(message.content)
                      }}
                    />
                    
                    {message.role === 'assistant' && (
                      <div className=\"mt-2 flex items-center space-x-2\">
                        <Button
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className=\"h-6 text-xs\"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className=\"w-3 h-3 mr-1\" />
                          ) : (
                            <Copy className=\"w-3 h-3 mr-1\" />
                          )}
                          {copiedMessageId === message.id ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className=\"flex justify-start\">
              <div className=\"max-w-3xl bg-white border border-gray-200 rounded-lg px-4 py-3\">
                <div className=\"flex items-center space-x-3\">
                  <div className=\"flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center\">
                    <Bot className=\"w-4 h-4 text-gray-600\" />
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <Loader2 className=\"w-4 h-4 animate-spin text-gray-400\" />
                    <span className=\"text-sm text-gray-500\">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Card className=\"bg-red-50 border-red-200\">
              <CardContent className=\"p-4\">
                <div className=\"flex items-start space-x-3\">
                  <AlertCircle className=\"w-5 h-5 text-red-500 flex-shrink-0 mt-0.5\" />
                  <div>
                    <h4 className=\"font-medium text-red-900\">Error</h4>
                    <p className=\"text-sm text-red-700 mt-1\">
                      {error.message || 'Something went wrong. Please try again.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className=\"border-t bg-white p-4\">
        <div className=\"max-w-4xl mx-auto\">
          <form onSubmit={handleSubmit} className=\"flex space-x-3\">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder={`Ask me about ${getTopicDisplay().toLowerCase()}, nonprofit management, or anything else...`}
              className=\"flex-1\"
              disabled={isLoading}
              autoFocus
            />
            <Button
              type=\"submit\"
              disabled={isLoading || !input.trim()}
              className=\"px-6\"
            >
              {isLoading ? (
                <Loader2 className=\"w-4 h-4 animate-spin\" />
              ) : (
                <Send className=\"w-4 h-4\" />
              )}
            </Button>
          </form>
          
          <div className=\"mt-2 text-xs text-gray-500 text-center\">
            {userProfile.microsoftSession ? (
              <span>✓ Connected to CiviCRM • Enhanced features available</span>
            ) : (
              <span>Using public data • Sign in for enhanced features</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}