'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { chatService } from '../lib/chat-service'
import type { MessageVote, SuggestedAction } from '../../lib/db/schema'

interface MessageActionsProps {
  messageId: string
  userId: string
  content: string
  isAssistant: boolean
  onVote?: (vote: 'up' | 'down', feedback?: string) => void
  onActionComplete?: (actionId: string) => void
}

export function MessageActions({ 
  messageId, 
  userId, 
  content, 
  isAssistant, 
  onVote, 
  onActionComplete 
}: MessageActionsProps) {
  const [currentVote, setCurrentVote] = useState<'up' | 'down' | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([])
  const [showSuggestedActions, setShowSuggestedActions] = useState(false)

  // Load user's existing vote and suggested actions
  useEffect(() => {
    if (isAssistant) {
      loadUserVote()
      loadSuggestedActions()
    }
  }, [isAssistant, messageId, userId])

  const loadUserVote = async () => {
    try {
      const vote = await chatService.getUserVote(messageId, userId)
      if (vote) {
        setCurrentVote(vote.vote as 'up' | 'down')
      }
    } catch (error) {
      console.error('Failed to load user vote:', error)
    }
  }

  const loadSuggestedActions = async () => {
    try {
      const actions = await chatService.getMessageSuggestedActions(messageId)
      setSuggestedActions(actions)
      setShowSuggestedActions(actions.length > 0)
    } catch (error) {
      console.error('Failed to load suggested actions:', error)
    }
  }

  const handleVote = async (vote: 'up' | 'down') => {
    try {
      await chatService.voteOnMessage(messageId, userId, vote, feedbackText)
      setCurrentVote(vote)
      setShowFeedback(false)
      setFeedbackText('')
      onVote?.(vote, feedbackText)
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleActionComplete = async (actionId: string) => {
    try {
      await chatService.completeSuggestedAction(actionId)
      setSuggestedActions(actions => 
        actions.map(action => 
          action.id === actionId ? { ...action, isCompleted: true } : action
        )
      )
      onActionComplete?.(actionId)
    } catch (error) {
      console.error('Failed to complete action:', error)
    }
  }

  const generateSuggestedActions = (content: string): SuggestedAction[] => {
    const suggestions: Partial<SuggestedAction>[] = []
    
    // Analyze content for action suggestions
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('follow up') || lowerContent.includes('next step')) {
      suggestions.push({
        action: 'Schedule Follow-up',
        description: 'Schedule a follow-up meeting or reminder',
        category: 'follow-up'
      })
    }
    
    if (lowerContent.includes('template') || lowerContent.includes('document')) {
      suggestions.push({
        action: 'Create Template',
        description: 'Create a template based on this advice',
        category: 'template'
      })
    }
    
    if (lowerContent.includes('board') || lowerContent.includes('governance')) {
      suggestions.push({
        action: 'Board Meeting Agenda',
        description: 'Add to next board meeting agenda',
        category: 'next-step'
      })
    }
    
    if (lowerContent.includes('fundraising') || lowerContent.includes('donor')) {
      suggestions.push({
        action: 'Update Fundraising Plan',
        description: 'Incorporate into fundraising strategy',
        category: 'next-step'
      })
    }
    
    if (lowerContent.includes('volunteer') || lowerContent.includes('staff')) {
      suggestions.push({
        action: 'Share with Team',
        description: 'Share this guidance with relevant team members',
        category: 'next-step'
      })
    }
    
    return suggestions as SuggestedAction[]
  }

  return (
    <div className=\"space-y-3\">
      {/* Message Actions */}
      <div className=\"flex items-center space-x-2\">
        <Button
          variant=\"ghost\"
          size=\"sm\"
          onClick={copyToClipboard}
          className=\"h-6 text-xs\"
        >
          {copiedMessageId === messageId ? (
            <Check className=\"w-3 h-3 mr-1\" />
          ) : (
            <Copy className=\"w-3 h-3 mr-1\" />
          )}
          {copiedMessageId === messageId ? 'Copied!' : 'Copy'}
        </Button>

        {isAssistant && (
          <>
            <Button
              variant={currentVote === 'up' ? 'default' : 'ghost'}
              size=\"sm\"
              onClick={() => handleVote('up')}
              className=\"h-6 text-xs\"
            >
              <ThumbsUp className=\"w-3 h-3 mr-1\" />
              Helpful
            </Button>
            
            <Button
              variant={currentVote === 'down' ? 'default' : 'ghost'}
              size=\"sm\"
              onClick={() => setShowFeedback(true)}
              className=\"h-6 text-xs\"
            >
              <ThumbsDown className=\"w-3 h-3 mr-1\" />
              Not Helpful
            </Button>

            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={() => setShowSuggestedActions(!showSuggestedActions)}
              className=\"h-6 text-xs\"
            >
              <MessageSquare className=\"w-3 h-3 mr-1\" />
              Actions
            </Button>
          </>
        )}
      </div>

      {/* Feedback Input */}
      {showFeedback && (
        <Card className=\"bg-yellow-50 border-yellow-200\">
          <CardContent className=\"p-3\">
            <div className=\"space-y-2\">
              <label className=\"text-sm font-medium text-yellow-800\">
                How can we improve this response?
              </label>
              <Input
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder=\"Your feedback helps us improve...\"
                className=\"bg-white\"
              />
              <div className=\"flex space-x-2\">
                <Button
                  size=\"sm\"
                  onClick={() => handleVote('down')}
                  className=\"bg-yellow-600 hover:bg-yellow-700\"
                >
                  Submit Feedback
                </Button>
                <Button
                  size=\"sm\"
                  variant=\"outline\"
                  onClick={() => setShowFeedback(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Actions */}
      {showSuggestedActions && isAssistant && (
        <Card className=\"bg-blue-50 border-blue-200\">
          <CardContent className=\"p-3\">
            <div className=\"space-y-3\">
              <div className=\"flex items-center justify-between\">
                <h4 className=\"text-sm font-medium text-blue-900\">Suggested Actions</h4>
                <Badge variant=\"secondary\" className=\"text-xs\">
                  {suggestedActions.filter(a => !a.isCompleted).length} remaining
                </Badge>
              </div>
              
              {suggestedActions.length === 0 ? (
                <div className=\"space-y-2\">
                  {generateSuggestedActions(content).map((suggestion, index) => (
                    <div key={index} className=\"flex items-center justify-between p-2 bg-white rounded border\">
                      <div>
                        <div className=\"text-sm font-medium text-gray-900\">
                          {suggestion.action}
                        </div>
                        <div className=\"text-xs text-gray-500\">
                          {suggestion.description}
                        </div>
                      </div>
                      <Button
                        size=\"sm\"
                        variant=\"outline\"
                        className=\"text-xs\"
                        onClick={() => {
                          // In a real app, this would create the action in the database
                          console.log('Action suggested:', suggestion.action)
                        }}
                      >
                        <ExternalLink className=\"w-3 h-3 mr-1\" />
                        Do
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className=\"space-y-2\">
                  {suggestedActions.map((action) => (
                    <div key={action.id} className=\"flex items-center justify-between p-2 bg-white rounded border\">
                      <div className={action.isCompleted ? 'opacity-50' : ''}>
                        <div className=\"text-sm font-medium text-gray-900\">
                          {action.action}
                        </div>
                        <div className=\"text-xs text-gray-500\">
                          {action.description}
                        </div>
                      </div>
                      {!action.isCompleted && (
                        <Button
                          size=\"sm\"
                          variant=\"outline\"
                          className=\"text-xs\"
                          onClick={() => handleActionComplete(action.id)}
                        >
                          <Check className=\"w-3 h-3 mr-1\" />
                          Done
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}