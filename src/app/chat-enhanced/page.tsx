'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChatSidebar } from '../../components/chat-sidebar'
import { ChatInterfaceStream } from '../../components/chat-interface-stream'
import { chatService } from '../../lib/chat-service'
import type { User } from '../../../lib/db/schema'

export default function EnhancedChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    // Get user profile from localStorage (from onboarding)
    const storedProfile = localStorage.getItem('userProfile')
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile))
    } else {
      // Redirect to onboarding if no profile
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (userProfile && session) {
      initializeUser()
    }
  }, [userProfile, session])

  const initializeUser = async () => {
    try {
      const email = userProfile.email || session?.user?.email
      if (!email) return

      // Get or create user in database
      let dbUser = await chatService.getUserByEmail(email)
      
      if (!dbUser) {
        // Create new user
        dbUser = await chatService.createUser({
          email,
          name: userProfile.microsoftSession?.name || session?.user?.name,
          role: userProfile.role,
          customRole: userProfile.customRole,
          topic: userProfile.topic,
          customTopic: userProfile.customTopic,
          identification: userProfile.identification,
          dataAccess: userProfile.dataAccess || ['public'],
          microsoftSession: userProfile.microsoftSession
        })
      }

      setUser(dbUser)
    } catch (error) {
      console.error('Failed to initialize user:', error)
    }
  }

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  const handleNewChat = async () => {
    if (!user) return

    try {
      const newChat = await chatService.createChat(user.id, 'New Conversation')
      setCurrentChatId(newChat.id)
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  if (status === 'loading' || !userProfile) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Loading your personalized AI assistant...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Initializing your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=\"min-h-screen bg-gray-50 flex\">
      <ChatSidebar
        currentChatId={currentChatId}
        userId={user.id}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />
      
      <div className=\"flex-1 flex flex-col\">
        {currentChatId ? (
          <ChatInterfaceStream
            userProfile={userProfile}
            chatId={currentChatId}
            userId={user.id}
          />
        ) : (
          <div className=\"flex-1 flex items-center justify-center\">
            <div className=\"text-center max-w-md\">
              <div className=\"bg-blue-600 p-4 rounded-full inline-block mb-4\">
                <svg className=\"w-8 h-8 text-white\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
                </svg>
              </div>
              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">
                Welcome to MAS AI Assistant
              </h2>
              <p className=\"text-gray-600 mb-6\">
                Start a new conversation or select an existing one from the sidebar to get personalized nonprofit consulting advice.
              </p>
              <button
                onClick={handleNewChat}
                className=\"inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}