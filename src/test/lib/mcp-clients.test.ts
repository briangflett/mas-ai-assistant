import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MCPClients } from '../../lib/mcp-clients'

// Mock the CiviCRM client
vi.mock('../../../mcp-servers/civicrm/dist/civicrm-client.js', () => ({
  CiviCRMClient: vi.fn().mockImplementation(() => ({
    getOverallStats: vi.fn().mockResolvedValue({
      total_contacts: 100,
      total_contributions: 50,
      total_cases: 25,
      active_events: 5
    }),
    getContacts: vi.fn().mockResolvedValue([
      { id: 1, display_name: 'John Doe', email: 'john@example.com' },
      { id: 2, display_name: 'Jane Smith', email: 'jane@example.com' }
    ]),
    getCasesByRole: vi.fn().mockResolvedValue([
      { id: 1, subject: 'Test Case', status: 'Active' }
    ]),
    apiCall: vi.fn().mockResolvedValue({ values: { 1: { id: 1, email: 'test@example.com' } } })
  }))
}))

describe('MCPClients', () => {
  let mcpClients: MCPClients

  beforeEach(() => {
    mcpClients = new MCPClients()
  })

  describe('messageNeedsCiviCRMData', () => {
    it('should identify messages that need CiviCRM data', () => {
      const needsData = mcpClients['messageNeedsCiviCRMData']('What are my active projects?')
      expect(needsData).toBe(true)
    })

    it('should identify messages that do not need CiviCRM data', () => {
      const needsData = mcpClients['messageNeedsCiviCRMData']('What is nonprofit governance?')
      expect(needsData).toBe(false)
    })

    it('should detect case-related keywords', () => {
      const testCases = [
        'Show me my cases',
        'What projects am I working on?',
        'How many clients do I have?',
        'What are my open assignments?'
      ]
      
      testCases.forEach(message => {
        expect(mcpClients['messageNeedsCiviCRMData'](message)).toBe(true)
      })
    })
  })

  describe('shouldUseOpenAI', () => {
    const mockProfile = {
      role: 'mas-staff-vc',
      topic: 'AI',
      identification: 'email',
      dataAccess: ['public'],
      email: 'test@example.com'
    }

    it('should use OpenAI for technical questions', () => {
      const useOpenAI = mcpClients['shouldUseOpenAI'](mockProfile, 'Help me write Python code')
      expect(useOpenAI).toBe(true)
    })

    it('should use OpenAI for data analysis questions', () => {
      const useOpenAI = mcpClients['shouldUseOpenAI'](mockProfile, 'Analyze this fundraising data')
      expect(useOpenAI).toBe(true)
    })

    it('should use Claude for general nonprofit questions', () => {
      const useOpenAI = mcpClients['shouldUseOpenAI'](mockProfile, 'How do I improve board engagement?')
      expect(useOpenAI).toBe(false)
    })
  })

  describe('getRoleSpecificGuidance', () => {
    it('should provide MAS client guidance', () => {
      const guidance = mcpClients['getRoleSpecificGuidance']('mas-client')
      expect(guidance).toContain('MAS consulting services')
    })

    it('should provide MAS staff/VC guidance', () => {
      const guidance = mcpClients['getRoleSpecificGuidance']('mas-staff-vc')
      expect(guidance).toContain('volunteer consulting')
      expect(guidance).toContain('CiviCRM')
    })

    it('should provide Canadian charity guidance', () => {
      const guidance = mcpClients['getRoleSpecificGuidance']('canadian-charity')
      expect(guidance).toContain('Canadian nonprofit')
    })
  })
})