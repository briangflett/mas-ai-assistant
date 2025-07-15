interface UserProfile {
  role: string;
  customRole?: string;
  topic: string;
  customTopic?: string;
  identification: string;
  email?: string;
  dataAccess: string[];
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
      
      const contextualPrompt = this.buildContextualPrompt(userProfile, previousMessages);
      const fullPrompt = `${this.basePrompt}\n\n${contextualPrompt}\n\nUser question: ${message}`;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('MCP Client error:', error);
      
      return this.getFallbackResponse(message, context);
    }
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