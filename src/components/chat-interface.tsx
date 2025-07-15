'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface UserProfile {
  role: string;
  customRole?: string;
  topic: string;
  customTopic?: string;
  identification: string;
  email?: string;
  dataAccess: string[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsedProfile = JSON.parse(profile);
      setUserProfile(parsedProfile);
      
      const getRoleDisplay = () => {
        if (parsedProfile.role === 'other') {
          return parsedProfile.customRole || 'Other';
        }
        const roleMap = {
          'mas-client': 'MAS Client',
          'mas-staff-vc': 'MAS Staff/Volunteer Consultant',
          'canadian-charity': 'Canadian Charity Team Member'
        };
        return roleMap[parsedProfile.role as keyof typeof roleMap] || parsedProfile.role;
      };

      const getTopicDisplay = () => {
        return parsedProfile.topic === 'Other' ? parsedProfile.customTopic || 'Other' : parsedProfile.topic;
      };

      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hello! I'm your MAS AI Assistant. I see you're interested in ${getTopicDisplay()} and you're a ${getRoleDisplay()}. I have access to ${parsedProfile.dataAccess.join(', ')} data to help you. What would you like to work on today?`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
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
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetProfile = () => {
    localStorage.removeItem('userProfile');
    router.push('/');
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MAS AI Assistant</h1>
              <div className="ml-4 text-sm text-gray-600">
                {userProfile.role === 'other' ? userProfile.customRole : userProfile.role} • {userProfile.topic === 'Other' ? userProfile.customTopic : userProfile.topic}
              </div>
            </div>
            <button
              onClick={resetProfile}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Change Profile
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 shadow-sm border rounded-lg px-4 py-2 max-w-xs lg:max-w-md xl:max-w-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t bg-white p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
            >
              Send
            </button>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setInputMessage(`Help me with ${userProfile.topic === 'Other' ? userProfile.customTopic : userProfile.topic}`)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {userProfile.topic === 'Other' ? userProfile.customTopic : userProfile.topic}
            </button>
            {userProfile.role === 'mas-staff-vc' && (
              <>
                <button
                  onClick={() => setInputMessage('Show me VC templates')}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  VC Templates
                </button>
                <button
                  onClick={() => setInputMessage('Show me project history')}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Project History
                </button>
              </>
            )}
            <button
              onClick={() => setInputMessage('What can you help me with?')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Get Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}