import { describe, it, expect } from 'evalite'
import { mcpClients } from '../../lib/mcp-clients'

describe('Response Quality Evaluation', () => {
  const masClientProfile = {
    role: 'mas-client',
    topic: 'Fundraising',
    identification: 'email',
    email: 'test@example.com',
    dataAccess: ['public']
  }

  const masStaffProfile = {
    role: 'mas-staff-vc',
    topic: 'Using CiviCRM',
    identification: 'microsoft-login',
    email: 'staff@masadvise.org',
    dataAccess: ['public', 'vc-templates', 'project-history'],
    microsoftSession: {
      name: 'Test Staff',
      email: 'staff@masadvise.org',
      accessToken: 'mock-token'
    }
  }

  it('should provide fundraising advice appropriate for MAS clients', async () => {
    const response = await mcpClients.processMessage(
      'How should I approach major donor cultivation for our small nonprofit?',
      {
        userProfile: masClientProfile,
        previousMessages: []
      }
    )

    expect(response).toContain('donor')
    expect(response).toContain('cultivation')
    expect(response).not.toContain('I don\\'t have access')
    expect(response.length).toBeGreaterThan(100)
  })

  it('should provide role-specific guidance for MAS staff', async () => {
    const response = await mcpClients.processMessage(
      'What are best practices for helping clients implement CiviCRM?',
      {
        userProfile: masStaffProfile,
        previousMessages: []
      }
    )

    expect(response).toContain('CiviCRM')
    expect(response).toContain('client')
    expect(response).toContain('implementation')
    expect(response.length).toBeGreaterThan(150)
  })

  it('should maintain context across conversation turns', async () => {
    const firstResponse = await mcpClients.processMessage(
      'I need help with board governance',
      {
        userProfile: masClientProfile,
        previousMessages: []
      }
    )

    const secondResponse = await mcpClients.processMessage(
      'Can you give me specific examples?',
      {
        userProfile: masClientProfile,
        previousMessages: [
          {
            id: '1',
            content: 'I need help with board governance',
            sender: 'user',
            timestamp: new Date()
          },
          {
            id: '2',
            content: firstResponse,
            sender: 'assistant',
            timestamp: new Date()
          }
        ]
      }
    )

    expect(secondResponse).toContain('board')
    expect(secondResponse).toContain('governance')
    expect(secondResponse).not.toContain('I don\\'t have context')
  })

  it('should handle CiviCRM-specific queries for authenticated users', async () => {
    const response = await mcpClients.processMessage(
      'What are my active projects?',
      {
        userProfile: masStaffProfile,
        previousMessages: []
      }
    )

    // Should attempt to fetch CiviCRM data
    expect(response).not.toContain('I apologize, but I\\'m currently unable to directly access')
    expect(response.length).toBeGreaterThan(50)
  })

  it('should provide appropriate fallback for unauthenticated CiviCRM queries', async () => {
    const response = await mcpClients.processMessage(
      'What are my active projects?',
      {
        userProfile: masClientProfile,
        previousMessages: []
      }
    )

    // Should provide helpful fallback even without CiviCRM access
    expect(response).toContain('project')
    expect(response.length).toBeGreaterThan(100)
  })

  it('should select appropriate LLM based on query type', async () => {
    const technicalResponse = await mcpClients.processMessage(
      'Help me write a Python script to analyze donation data',
      {
        userProfile: masStaffProfile,
        previousMessages: []
      }
    )

    const consultingResponse = await mcpClients.processMessage(
      'How should I approach strategic planning for our nonprofit?',
      {
        userProfile: masClientProfile,
        previousMessages: []
      }
    )

    // Both should provide relevant responses
    expect(technicalResponse).toContain('Python')
    expect(consultingResponse).toContain('strategic')
    expect(consultingResponse).toContain('planning')
  })

  it('should adapt tone and complexity to user role', async () => {
    const query = 'How do I set up recurring donations?'
    
    const clientResponse = await mcpClients.processMessage(query, {
      userProfile: masClientProfile,
      previousMessages: []
    })

    const staffResponse = await mcpClients.processMessage(query, {
      userProfile: masStaffProfile,
      previousMessages: []
    })

    // Both should mention recurring donations
    expect(clientResponse).toContain('recurring')
    expect(staffResponse).toContain('recurring')
    
    // Staff response might be more technical/implementation-focused
    expect(staffResponse.length).toBeGreaterThan(clientResponse.length * 0.8)
  })
})