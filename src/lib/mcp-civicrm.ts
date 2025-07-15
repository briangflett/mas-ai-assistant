// import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class CiviCRMMCP {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async connect() {
    if (this.client) {
      return; // Already connected
    }

    try {
      // For now, we'll bypass the MCP server and use the direct client
      // This is a temporary solution until we fix the MCP transport
      this.transport = null;

      this.client = new Client({
        name: 'mas-ai-assistant-client',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      await this.client.connect(this.transport);
      console.log('Connected to CiviCRM MCP server');
    } catch (error) {
      console.error('Failed to connect to CiviCRM MCP server:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.transport) {
      await this.client.close();
      this.client = null;
      this.transport = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async callTool(name: string, args: any = {}) {
    if (!this.client) {
      await this.connect();
    }

    try {
      const result = await this.client!.callTool({
        name,
        arguments: args,
      });

      if (result.isError) {
        throw new Error(`CiviCRM MCP tool error: ${result.content[0]?.text || 'Unknown error'}`);
      }

      return result.content[0]?.text || '';
    } catch (error) {
      console.error(`CiviCRM MCP tool call failed (${name}):`, error);
      throw error;
    }
  }

  // Convenience methods for common operations
  async getContacts(limit = 25, offset = 0) {
    const result = await this.callTool('get_contacts', { limit, offset });
    return JSON.parse(result);
  }

  async searchContacts(query: string, limit = 25) {
    const result = await this.callTool('search_contacts', { query, limit });
    return JSON.parse(result);
  }

  async getContact(id: number) {
    const result = await this.callTool('get_contact', { id });
    return JSON.parse(result);
  }

  async getContributions(limit = 25, offset = 0) {
    const result = await this.callTool('get_contributions', { limit, offset });
    return JSON.parse(result);
  }

  async getContributionsByContact(contactId: number) {
    const result = await this.callTool('get_contributions_by_contact', { contact_id: contactId });
    return JSON.parse(result);
  }

  async getContributionStats() {
    const result = await this.callTool('get_contribution_stats');
    return JSON.parse(result);
  }

  async getEvents(limit = 25, offset = 0) {
    const result = await this.callTool('get_events', { limit, offset });
    return JSON.parse(result);
  }

  async getUpcomingEvents(limit = 10) {
    const result = await this.callTool('get_upcoming_events', { limit });
    return JSON.parse(result);
  }

  async getOverallStats() {
    const result = await this.callTool('get_overall_stats');
    return JSON.parse(result);
  }

  // Case management methods
  async getCases(limit = 25, offset = 0, statusFilter?: string, dateFilter?: string) {
    const result = await this.callTool('get_cases', { 
      limit, 
      offset, 
      status_filter: statusFilter, 
      date_filter: dateFilter 
    });
    return JSON.parse(result);
  }

  async getCaseById(caseId: number) {
    const result = await this.callTool('get_case_by_id', { case_id: caseId });
    return JSON.parse(result);
  }

  async getCasesByContact(contactId: number) {
    const result = await this.callTool('get_cases_by_contact', { contact_id: contactId });
    return JSON.parse(result);
  }

  async getCasesByRole(contactId: number, roleType: 'client' | 'case_coordinator' | 'case_manager') {
    const result = await this.callTool('get_cases_by_role', { contact_id: contactId, role_type: roleType });
    return JSON.parse(result);
  }

  async getCaseContacts(caseId: number) {
    const result = await this.callTool('get_case_contacts', { case_id: caseId });
    return JSON.parse(result);
  }

  async getCaseActivities(caseId: number, limit = 25) {
    const result = await this.callTool('get_case_activities', { case_id: caseId, limit });
    return JSON.parse(result);
  }

  async getOpenCasesByCoordinator(coordinatorId: number) {
    const result = await this.callTool('get_open_cases_by_coordinator', { coordinator_id: coordinatorId });
    return JSON.parse(result);
  }
}

// Singleton instance
export const civiCRMClient = new CiviCRMMCP();