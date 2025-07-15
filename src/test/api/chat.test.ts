import { describe, it, expect, vi } from 'vitest'
import { POST } from '../../app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock the MCP clients
vi.mock('../../lib/mcp-clients', () => ({
  mcpClients: {
    processMessage: vi.fn().mockResolvedValue('This is a test response')
  }
}))

describe('/api/chat', () => {
  it('should process chat messages successfully', async () => {
    const requestBody = {
      message: 'Hello, how can you help me?',
      userProfile: {
        role: 'mas-client',
        topic: 'Fundraising',
        identification: 'email',
        email: 'test@example.com',
        dataAccess: ['public']
      },
      previousMessages: []
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.response).toBe('This is a test response')
  })

  it('should handle missing message', async () => {
    const requestBody = {
      userProfile: {
        role: 'mas-client',
        topic: 'Fundraising',
        identification: 'email',
        email: 'test@example.com',
        dataAccess: ['public']
      },
      previousMessages: []
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message is required')
  })

  it('should handle missing user profile', async () => {
    const requestBody = {
      message: 'Hello, how can you help me?',
      previousMessages: []
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User profile is required')
  })

  it('should handle MCP client errors', async () => {
    const { mcpClients } = await import('../../lib/mcp-clients')
    vi.mocked(mcpClients.processMessage).mockRejectedValueOnce(new Error('Processing failed'))

    const requestBody = {
      message: 'Hello, how can you help me?',
      userProfile: {
        role: 'mas-client',
        topic: 'Fundraising',
        identification: 'email',
        email: 'test@example.com',
        dataAccess: ['public']
      },
      previousMessages: []
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid JSON')
  })

  it('should validate user profile structure', async () => {
    const requestBody = {
      message: 'Hello, how can you help me?',
      userProfile: {
        role: 'mas-client'
        // Missing required fields
      },
      previousMessages: []
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('profile')
  })
})