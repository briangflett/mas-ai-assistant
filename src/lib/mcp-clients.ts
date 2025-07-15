import { CiviCRMClient } from '../../mcp-servers/civicrm/dist/civicrm-client.js';

interface UserProfile {
  role: string;
  customRole?: string;
  topic: string;
  customTopic?: string;
  identification: string;
  email?: string;
  dataAccess: string[];
  microsoftSession?: {
    name?: string;
    email?: string;
    accessToken?: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatContext {
  userProfile: UserProfile;
  previousMessages: Message[];
}

class MCPClients {
  private civiCRMClient: CiviCRMClient;
  
  constructor() {
    // Initialize CiviCRM client
    this.civiCRMClient = new CiviCRMClient({
      cvPath: '/home/brian/buildkit/bin/cv',
      settingsPath: '/home/brian/buildkit/build/masdemo/web/wp-content/uploads/civicrm/civicrm.settings.php',
    });
  }
  
  private basePrompt = `You are MAS AI Assistant, a specialized AI assistant designed to help nonprofits and social impact organizations maximize their effectiveness. You provide intelligent, actionable advice on operations, fundraising, program delivery, volunteer management, and organizational development.

Key principles:
- Focus on practical, implementable solutions
- Consider resource constraints typical of nonprofits
- Emphasize impact measurement and storytelling
- Suggest technology solutions that are affordable and accessible
- Provide step-by-step guidance when possible
- Consider ethical implications of recommendations

Always tailor your responses to the user's specific role, organization size, and stated goals.`;

  async processMessage(message: string, context: ChatContext): Promise<string> {
    try {
      const { userProfile, previousMessages } = context;
      
      // Check if the message requires CiviCRM data
      const needsCiviCRMData = this.messageNeedsCiviCRMData(message);
      let civiCRMData = '';
      
      console.log('Message analysis:', {
        message: message.slice(0, 100),
        needsCiviCRMData,
        userProfile: {
          email: userProfile.email,
          microsoftSession: userProfile.microsoftSession
        }
      });
      
      if (needsCiviCRMData) {
        console.log('Message requires CiviCRM data, fetching...');
        civiCRMData = await this.getCiviCRMData(message, userProfile);
      }
      
      const contextualPrompt = this.buildContextualPrompt(userProfile, previousMessages);
      const fullPrompt = `${this.basePrompt}\n\n${contextualPrompt}\n\n${civiCRMData ? `CiviCRM Data:\n${civiCRMData}\n\n` : ''}User question: ${message}`;
      
      // Choose LLM based on user context
      const shouldUseGPT = this.shouldUseOpenAI(userProfile, message);
      
      console.log(`Using ${shouldUseGPT ? 'OpenAI GPT-4' : 'Claude'} for message: "${message.slice(0, 50)}..."`);
      
      if (shouldUseGPT) {
        return await this.callOpenAI(fullPrompt);
      } else {
        return await this.callClaude(fullPrompt);
      }
    } catch (error) {
      console.error('MCP Client error:', error);
      
      return this.getFallbackResponse(message, context);
    }
  }

  private messageNeedsCiviCRMData(message: string): boolean {
    const messageLower = message.toLowerCase();
    
    // Keywords that indicate CiviCRM data might be needed
    const civiCRMKeywords = [
      'contact', 'donor', 'donation', 'contribution', 'member',
      'event', 'participant', 'volunteer', 'database', 'crm',
      'fundraising', 'campaign', 'constituent', 'supporter',
      'case', 'project', 'service', 'client', 'coordinator',
      'activity', 'task', 'assignment', 'open', 'closed',
      'how many', 'statistics', 'stats', 'total', 'count',
      'recent', 'upcoming', 'list', 'show me', 'find', 'my'
    ];
    
    return civiCRMKeywords.some(keyword => messageLower.includes(keyword));
  }

  private async getCiviCRMData(message: string, userProfile: UserProfile): Promise<string> {
    try {
      const messageLower = message.toLowerCase();
      let data = '';
      
      // Get overall stats for general questions
      if (messageLower.includes('statistic') || messageLower.includes('overview') || 
          messageLower.includes('total') || messageLower.includes('how many')) {
        const stats = await this.civiCRMClient.getOverallStats();
        data += `Overall Statistics:\n${JSON.stringify(stats, null, 2)}\n\n`;
      }
      
      // Get contacts for contact-related questions
      if (messageLower.includes('contact') || messageLower.includes('donor') || 
          messageLower.includes('member') || messageLower.includes('constituent')) {
        const contacts = await this.civiCRMClient.getContacts(10);
        data += `Recent Contacts:\n${JSON.stringify(contacts, null, 2)}\n\n`;
      }
      
      // Get contributions for fundraising questions
      if (messageLower.includes('donation') || messageLower.includes('contribution') || 
          messageLower.includes('fundraising') || messageLower.includes('giving')) {
        const contributions = await this.civiCRMClient.getContributions(10);
        const stats = await this.civiCRMClient.getContributionStats();
        data += `Recent Contributions:\n${JSON.stringify(contributions, null, 2)}\n\n`;
        data += `Contribution Statistics:\n${JSON.stringify(stats, null, 2)}\n\n`;
      }
      
      // Get events for event-related questions
      if (messageLower.includes('event') || messageLower.includes('upcoming') || 
          messageLower.includes('program') || messageLower.includes('activity')) {
        const events = await this.civiCRMClient.getUpcomingEvents(5);
        data += `Upcoming Events:\n${JSON.stringify(events, null, 2)}\n\n`;
      }
      
      // Get case/project data for case management questions
      if (messageLower.includes('case') || messageLower.includes('project') || 
          messageLower.includes('service') || messageLower.includes('client')) {
        
        // Check if asking about specific user's cases (using Microsoft session if available)
        console.log('Checking for personal cases:', {
          hasMyOrOpen: messageLower.includes('my') || messageLower.includes('open'),
          hasEmail: !!userProfile.microsoftSession?.email,
          email: userProfile.microsoftSession?.email
        });
        
        if ((messageLower.includes('my') || messageLower.includes('open')) && 
            userProfile.microsoftSession?.email) {
          
          // Find the user's contact ID first
          console.log('Searching for user contact:', userProfile.microsoftSession.email);
          // Use direct email search instead of display_name search
          const userContact = await this.civiCRMClient.apiCall('Contact', 'get', {
            email: userProfile.microsoftSession.email,
            limit: 1,
            return: 'id,contact_type,display_name,first_name,last_name,email,phone,organization_name'
          });
          const userContactArray = Object.values(userContact.values || {});
          console.log('User contact search result:', userContactArray);
          
          if (userContactArray.length > 0) {
            const contactId = userContactArray[0].id;
            console.log('Found user contact ID:', contactId);
            
            // Get cases by coordinator role
            console.log('Getting cases by coordinator role...');
            const myCases = await this.civiCRMClient.getCasesByRole(contactId, 'case_coordinator');
            console.log('Cases by coordinator role:', myCases.length);
            data += `Your Cases (as Coordinator):\n${JSON.stringify(myCases, null, 2)}\n\n`;
            
            // Get open cases specifically
            console.log('Getting open cases by coordinator...');
            const openCases = await this.civiCRMClient.getOpenCasesByCoordinator(contactId);
            console.log('Open cases by coordinator:', openCases.length);
            data += `Your Open Cases:\n${JSON.stringify(openCases, null, 2)}\n\n`;
          } else {
            console.log('No user contact found for email:', userProfile.microsoftSession.email);
          }
        } else {
          // General case data
          const cases = await this.civiCRMClient.getCases(10);
          data += `Recent Cases:\n${JSON.stringify(cases, null, 2)}\n\n`;
        }
      }
      
      // Get specific case details if case ID is mentioned
      const caseIdMatch = message.match(/case\s+(\d+)/i);
      if (caseIdMatch) {
        const caseId = parseInt(caseIdMatch[1]);
        const caseDetails = await this.civiCRMClient.getCaseById(caseId);
        const caseActivities = await this.civiCRMClient.getCaseActivities(caseId, 10);
        data += `Case ${caseId} Details:\n${JSON.stringify(caseDetails, null, 2)}\n\n`;
        data += `Case ${caseId} Activities:\n${JSON.stringify(caseActivities, null, 2)}\n\n`;
      }
      
      // Search for specific names if mentioned
      const nameMatch = message.match(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/);
      if (nameMatch) {
        const searchQuery = nameMatch[0];
        const searchResults = await this.civiCRMClient.searchContacts(searchQuery, 5);
        data += `Search Results for "${searchQuery}":\n${JSON.stringify(searchResults, null, 2)}\n\n`;
      }
      
      console.log('CiviCRM data fetching completed. Data length:', data.length);
      return data;
    } catch (error) {
      console.error('Failed to get CiviCRM data:', error);
      return 'Note: Unable to retrieve CiviCRM data at this time.\n\n';
    }
  }

  private shouldUseOpenAI(userProfile: UserProfile, message: string): boolean {
    const messageLower = message.toLowerCase();
    
    // Use OpenAI for coding/technical tasks
    if (messageLower.includes('code') || messageLower.includes('programming') || 
        messageLower.includes('api') || messageLower.includes('javascript') ||
        messageLower.includes('python') || messageLower.includes('sql')) {
      return true;
    }
    
    // Use OpenAI for data analysis
    if (messageLower.includes('analyze') || messageLower.includes('data') || 
        messageLower.includes('report') || messageLower.includes('metrics')) {
      return true;
    }
    
    // Default to Claude for general nonprofit consulting
    return false;
  }

  private async callClaude(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }


  private buildContextualPrompt(userProfile: UserProfile, previousMessages: Message[]): string {
    const getRoleDisplay = () => {
      if (userProfile.role === 'other') {
        return userProfile.customRole || 'Other';
      }
      const roleMap = {
        'mas-client': 'MAS Client',
        'mas-staff-vc': 'MAS Staff/Volunteer Consultant',
        'canadian-charity': 'Canadian Charity Team Member'
      };
      return roleMap[userProfile.role as keyof typeof roleMap] || userProfile.role;
    };

    const getTopicDisplay = () => {
      return userProfile.topic === 'Other' ? userProfile.customTopic || 'Other' : userProfile.topic;
    };

    const profileContext = `
User Profile:
- Role: ${getRoleDisplay()}
- Primary Topic of Interest: ${getTopicDisplay()}
- Data Access Level: ${userProfile.dataAccess.join(', ')}
- Identification Method: ${userProfile.identification}

Recent conversation context:
${previousMessages.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}
    `;

    const roleSpecificGuidance = this.getRoleSpecificGuidance(userProfile.role);
    
    return `${profileContext}\n\n${roleSpecificGuidance}`;
  }

  private getRoleSpecificGuidance(role: string): string {
    const guidance = {
      'mas-client': 'Focus on MAS consulting services, implementation support, and leveraging MAS expertise for nonprofit growth.',
      'mas-staff-vc': 'Emphasize volunteer consulting best practices, MAS methodologies, CiviCRM expertise, and project management.',
      'canadian-charity': 'Focus on Canadian nonprofit regulations, funding opportunities, and sector-specific challenges.',
      'other': 'Provide general nonprofit management advice that can be adapted to various roles and contexts.'
    };

    return guidance[role as keyof typeof guidance] || guidance.other;
  }

  private getFallbackResponse(message: string, context: ChatContext): string {
    const { userProfile } = context;
    const messageLower = message.toLowerCase();
    
    const getRoleDisplay = () => {
      if (userProfile.role === 'other') {
        return userProfile.customRole || 'Other';
      }
      const roleMap = {
        'mas-client': 'MAS Client',
        'mas-staff-vc': 'MAS Staff/Volunteer Consultant',
        'canadian-charity': 'Canadian Charity Team Member'
      };
      return roleMap[userProfile.role as keyof typeof roleMap] || userProfile.role;
    };

    const getTopicDisplay = () => {
      return userProfile.topic === 'Other' ? userProfile.customTopic || 'Other' : userProfile.topic;
    };
    
    if (messageLower.includes('fundraising') || messageLower.includes('donor')) {
      return `Here are some fundraising strategies that could work well for your organization:

1. **Digital Fundraising**: Set up online donation forms and social media campaigns
2. **Grant Writing**: Research foundations aligned with your mission
3. **Peer-to-Peer Fundraising**: Engage your supporters to fundraise on your behalf
4. **Corporate Partnerships**: Develop relationships with local businesses
5. **Event Fundraising**: Host virtual or in-person events

Would you like me to elaborate on any of these strategies specifically for your role as a ${getRoleDisplay()}?`;
    }
    
    if (messageLower.includes('volunteer')) {
      return `For volunteer management, consider these approaches:

1. **Clear Role Descriptions**: Define specific volunteer positions and expectations
2. **Onboarding Process**: Create a welcoming orientation for new volunteers
3. **Recognition Programs**: Acknowledge volunteer contributions regularly
4. **Skill-Based Matching**: Match volunteers with roles that fit their skills
5. **Communication Tools**: Use platforms like Slack or VolunteerHub for coordination

What specific volunteer challenges are you facing?`;
    }
    
    if (messageLower.includes('civicrm') && userProfile.role === 'mas-staff-vc') {
      return `As a MAS Staff/Volunteer Consultant, here are some CiviCRM guidance areas I can help with:

1. **Implementation Planning**: Best practices for CiviCRM deployment
2. **Data Migration**: Moving from existing systems to CiviCRM
3. **Training and Support**: Helping organizations adopt CiviCRM effectively
4. **Custom Development**: Extensions and customizations for specific needs
5. **Reporting and Analytics**: Setting up meaningful reports and dashboards

Which CiviCRM area would you like to focus on?`;
    }
    
    if (messageLower.includes('program') || messageLower.includes('impact')) {
      return `To strengthen program delivery and measure impact:

1. **Logic Models**: Develop clear program theories of change
2. **Data Collection**: Implement systems to track program outcomes
3. **Stakeholder Feedback**: Regularly survey program participants
4. **Continuous Improvement**: Use data to refine program design
5. **Storytelling**: Document success stories and case studies

Given your interest in ${getTopicDisplay()}, which area would you like to explore first?`;
    }
    
    return `I'd be happy to help you with that! As a ${getRoleDisplay()} interested in ${getTopicDisplay()}, I can provide guidance on:

- Strategic planning and organizational development
- Fundraising and donor relations
- Program design and evaluation
- Volunteer management and engagement
- Operations and process improvement
- Technology solutions for nonprofits
${userProfile.role === 'mas-staff-vc' ? '- CiviCRM implementation and best practices\n- MAS consulting methodologies' : ''}

Could you provide more specific details about what you're looking to accomplish? I'll tailor my advice to your particular situation and goals.`;
  }
}

export const mcpClients = new MCPClients();