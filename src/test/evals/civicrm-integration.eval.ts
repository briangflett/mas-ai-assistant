import { describe, it, expect } from 'evalite'
import { mcpClients } from '../../lib/mcp-clients'

describe('CiviCRM Integration Evaluation', () => {
  const authenticatedProfile = {
    role: 'mas-staff-vc',
    topic: 'Using CiviCRM',
    identification: 'microsoft-login',
    email: 'brian.flett@masadvise.org',
    dataAccess: ['public', 'vc-templates', 'project-history'],
    microsoftSession: {
      name: 'Brian Flett',
      email: 'brian.flett@masadvise.org',
      accessToken: 'mock-token'
    }
  }

  it('should accurately identify when CiviCRM data is needed', async () => {
    const testCases = [
      { message: 'What are my active projects?', shouldNeed: true },
      { message: 'Show me my current cases', shouldNeed: true },
      { message: 'How many donors do we have?', shouldNeed: true },
      { message: 'What is nonprofit governance?', shouldNeed: false },
      { message: 'How do I write a grant proposal?', shouldNeed: false },
      { message: 'Tell me about my clients', shouldNeed: true },
      { message: 'What upcoming events are scheduled?', shouldNeed: true }
    ]

    for (const testCase of testCases) {
      const needsData = mcpClients['messageNeedsCiviCRMData'](testCase.message)
      expect(needsData).toBe(testCase.shouldNeed)
    }
  })

  it('should provide personalized responses with CiviCRM data', async () => {
    const response = await mcpClients.processMessage(
      'What are my active projects?',
      {
        userProfile: authenticatedProfile,
        previousMessages: []
      }
    )

    // Should not show fallback message
    expect(response).not.toContain('I apologize, but I\\'m currently unable to directly access')
    
    // Should contain project-related information
    expect(response).toMatch(/project|case|client/i)
    
    // Should be substantial and helpful
    expect(response.length).toBeGreaterThan(100)
  })

  it('should handle CiviCRM data integration errors gracefully', async () => {
    // Mock CiviCRM client to throw error
    const originalClient = mcpClients['civiCRMClient']
    mcpClients['civiCRMClient'] = {
      ...originalClient,
      getCasesByRole: async () => {
        throw new Error('CiviCRM connection failed')
      }
    }

    const response = await mcpClients.processMessage(
      'What are my active projects?',
      {
        userProfile: authenticatedProfile,
        previousMessages: []
      }
    )

    // Should provide fallback response
    expect(response).toContain('project')
    expect(response.length).toBeGreaterThan(50)
    
    // Restore original client
    mcpClients['civiCRMClient'] = originalClient
  })

  it('should format CiviCRM data appropriately for user consumption', async () => {
    const response = await mcpClients.processMessage(
      'Show me statistics about our organization',
      {
        userProfile: authenticatedProfile,
        previousMessages: []
      }
    )

    // Should present data in a user-friendly format
    expect(response).toMatch(/contact|contribution|event|case/i)
    expect(response).not.toContain('{"values"')
    expect(response).not.toContain('undefined')
    expect(response).not.toContain('null')
  })

  it('should respect user role when accessing CiviCRM data', async () => {
    const publicProfile = {
      role: 'canadian-charity',
      topic: 'Fundraising',
      identification: 'anonymous',
      dataAccess: ['public']
    }

    const publicResponse = await mcpClients.processMessage(
      'What are my active projects?',
      {
        userProfile: publicProfile,
        previousMessages: []
      }
    )

    const authenticatedResponse = await mcpClients.processMessage(
      'What are my active projects?',
      {
        userProfile: authenticatedProfile,
        previousMessages: []
      }
    )

    // Authenticated user should get more specific/personalized response
    expect(authenticatedResponse.length).toBeGreaterThan(publicResponse.length * 0.8)
  })

  it('should handle various CiviCRM query types appropriately', async () => {
    const queryTypes = [
      'What are my recent activities?',
      'Show me my client contacts',
      'How many cases am I managing?',
      'What events are coming up?',
      'Tell me about recent donations'
    ]

    for (const query of queryTypes) {
      const response = await mcpClients.processMessage(query, {
        userProfile: authenticatedProfile,
        previousMessages: []
      })

      // Each should provide relevant response
      expect(response.length).toBeGreaterThan(50)
      expect(response).not.toContain('I don\\'t understand')
      expect(response).not.toContain('error')
    }
  })

  it('should integrate CiviCRM data with conversational context', async () => {
    const response = await mcpClients.processMessage(
      'Based on my current projects, what should I focus on this week?',
      {
        userProfile: authenticatedProfile,
        previousMessages: []
      }
    )

    // Should combine CiviCRM data with actionable advice
    expect(response).toMatch(/project|case|focus|priority|week/i)
    expect(response).toContain('should')
    expect(response.length).toBeGreaterThan(150)
  })
})