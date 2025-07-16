import { streamText, convertToCoreMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { mcpClients } from '../../lib/mcp-clients'
import { z } from 'zod'

// Enhanced with Vercel AI SDK v5 streaming capabilities
export const runtime = 'edge'

// Zod schema for structured outputs
const ProjectInfoSchema = z.object({
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    client: z.string(),
    priority: z.enum(['low', 'medium', 'high'])
  }))
})

const UserProfileSchema = z.object({
  role: z.string(),
  topic: z.string(),
  identification: z.string(),
  email: z.string().optional(),
  dataAccess: z.array(z.string()),
  microsoftSession: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    accessToken: z.string().optional()
  }).optional()
})

const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender: z.enum(['user', 'assistant']),
  timestamp: z.date()
})

const RequestSchema = z.object({
  message: z.string(),
  userProfile: UserProfileSchema,
  previousMessages: z.array(MessageSchema).optional().default([])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userProfile, previousMessages } = RequestSchema.parse(body)

    // Determine which AI model to use (existing logic)
    const shouldUseOpenAI = mcpClients['shouldUseOpenAI'](userProfile, message)
    const model = shouldUseOpenAI ? openai('gpt-4o') : anthropic('claude-3-5-sonnet-20241022')

    // Check if message needs CiviCRM data
    const needsCiviCRMData = mcpClients['messageNeedsCiviCRMData'](message)
    let contextData = ''
    
    if (needsCiviCRMData) {
      try {
        contextData = await mcpClients['getCiviCRMData'](message, userProfile)
      } catch (error) {
        console.error('CiviCRM data fetch failed:', error)
        contextData = 'Note: Unable to retrieve CiviCRM data at this time.\\n\\n'
      }
    }

    // Build contextual prompt
    const contextualPrompt = mcpClients['buildContextualPrompt'](userProfile, previousMessages)
    const basePrompt = mcpClients['basePrompt']
    
    const systemPrompt = `${basePrompt}\\n\\n${contextualPrompt}\\n\\n${contextData ? `CiviCRM Data:\\n${contextData}\\n\\n` : ''}`

    // Convert messages to core format
    const coreMessages = convertToCoreMessages([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ])

    // Define tools for structured outputs
    const tools = {
      getProjectInfo: {
        description: 'Get structured information about user projects',
        parameters: ProjectInfoSchema,
        execute: async (params: z.infer<typeof ProjectInfoSchema>) => {
          return params
        }
      },
      getCiviCRMStats: {
        description: 'Get CiviCRM statistics in structured format',
        parameters: z.object({
          stats: z.object({
            totalContacts: z.number(),
            totalCases: z.number(),
            totalContributions: z.number(),
            activeEvents: z.number()
          })
        }),
        execute: async (params: any) => {
          return params
        }
      }
    }

    // Stream response with AI SDK
    const result = await streamText({
      model,
      messages: coreMessages,
      tools,
      maxTokens: 2000,
      temperature: 0.7,
      onFinish: async (completion) => {
        // Analytics and telemetry
        console.log('Chat completion:', {
          model: shouldUseOpenAI ? 'openai' : 'anthropic',
          tokensUsed: completion.usage?.totalTokens,
          finishReason: completion.finishReason,
          userRole: userProfile.role,
          hadCiviCRMData: needsCiviCRMData,
          responseLength: completion.text.length,
          timestamp: new Date().toISOString()
        })

        // TODO: Store analytics in database
        // await storeAnalytics({
        //   userId: userProfile.email,
        //   model: shouldUseOpenAI ? 'openai' : 'anthropic',
        //   tokensUsed: completion.usage?.totalTokens,
        //   responseTime: completion.responseTime,
        //   userRole: userProfile.role
        // })
      }
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat stream error:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format', details: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}