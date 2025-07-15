# MAS AI Assistant - Functional Guide

## Overview

The MAS AI Assistant is a specialized conversational AI designed to help nonprofits and social impact organizations maximize their effectiveness. It provides intelligent, actionable advice tailored to the user's specific role, organizational context, and goals.

## Core Features

### 1. Role-Based Personalization

The assistant adapts its responses based on four primary user roles:

#### MAS Client
- **Description**: Nonprofit staff receiving or seeking MAS consulting services
- **Features**: 
  - MAS-specific methodologies and frameworks
  - Implementation guidance for MAS recommendations
  - Access to case studies and best practices
  - Direct integration with project data when authenticated

#### MAS Staff/Volunteer Consultant
- **Description**: MAS employees and volunteer consultants
- **Features**:
  - Enhanced data access to CiviCRM project history
  - Volunteer consultant templates and resources
  - Case management support
  - CiviCRM implementation guidance
  - Project coordination tools

#### Canadian Charity Team Member
- **Description**: Staff, volunteers, or board members of Canadian nonprofits
- **Features**:
  - Canadian-specific regulations and compliance guidance
  - Funding opportunities and grant resources
  - Sector-specific challenges and solutions
  - Cultural and legal context awareness

#### Other Roles
- **Description**: Flexible category for diverse backgrounds
- **Features**:
  - Customizable role descriptions
  - General nonprofit management advice
  - Adaptable recommendations

### 2. Topic Specialization

The assistant provides deep expertise in key nonprofit areas:

#### Core Topics
- **AI**: Implementation strategies, tools, and ethical considerations
- **Planning**: Strategic planning, program design, and evaluation
- **Governance**: Board development, policies, and compliance
- **HR**: Staff management, volunteer coordination, and organizational development
- **Fundraising**: Donor relations, campaign management, and stewardship
- **Finance & IT**: Financial management, technology solutions, and systems
- **Marketing & Communications**: Brand development, outreach, and storytelling

#### Specialized Topics (MAS Staff/VC)
- **Using CiviCRM**: Day-to-day usage, reporting, and optimization
- **Implementing CiviCRM**: Planning, migration, and deployment strategies

### 3. Authentication & Data Access

#### Authentication Methods

**Microsoft Login (Recommended for MAS Staff/VC)**
- Single sign-on with Microsoft 365
- Access to enhanced features and templates
- Integration with CiviCRM project history
- Personalized project recommendations

**Email Identification**
- Basic personalization
- Email-based contact matching
- Limited CiviCRM integration

**Anonymous Access**
- General nonprofit advice
- Public resources only
- No personalized data access

#### Data Access Levels

**Public Access**
- General nonprofit best practices
- Public resources and templates
- Generic advice and recommendations

**Enhanced Access (Authenticated Users)**
- Personalized recommendations
- Access to organizational data
- Case-specific guidance

**Premium Access (Microsoft Authenticated MAS Staff/VC)**
- Full CiviCRM integration
- Project history access
- Volunteer consultant templates
- Case management tools

### 4. CiviCRM Integration

#### Personal Project Access
When authenticated with Microsoft login, the assistant can:
- Retrieve your active cases/projects
- Show project details and status
- Provide case-specific recommendations
- Access client information and history

#### Supported CiviCRM Queries
- "What are my active projects?"
- "Show me details about case 24025"
- "Who are my current clients?"
- "What's the status of my open cases?"
- "How many contributions did we receive this month?"

#### Data Types Accessed
- **Cases/Projects**: Subject, status, client information, coordinator assignments
- **Contacts**: Donors, clients, volunteers, staff
- **Contributions**: Donations, grants, funding information
- **Events**: Programs, workshops, meetings
- **Activities**: Tasks, meetings, communications
- **Relationships**: Case coordinator assignments, client relationships

### 5. Intelligent LLM Selection

The assistant automatically selects the most appropriate AI model based on your query:

#### Claude (Primary)
- **Best for**: Nonprofit consulting, strategic advice, general guidance
- **Strengths**: Contextual understanding, ethical reasoning, comprehensive responses
- **Use cases**: Planning, governance, fundraising strategy, program development

#### OpenAI GPT-4 (Secondary)
- **Best for**: Technical tasks, data analysis, coding assistance
- **Strengths**: Technical accuracy, structured analysis, code generation
- **Use cases**: API integration, data analysis, technical implementation, reporting

## User Journey

### 1. First-Time Setup

**Step 1: Role Selection**
- Choose your primary role from the available options
- Provide custom role description if "Other" is selected
- System configures appropriate features and access levels

**Step 2: Topic Selection**
- Select your primary area of interest
- System tailors initial recommendations and resources
- Influences the type of advice and examples provided

**Step 3: Authentication**
- Choose identification method based on your needs
- Microsoft login provides enhanced features
- Email or anonymous access for basic functionality

### 2. Conversation Flow

**Starting a Conversation**
- Open-ended questions are welcome
- System provides contextual, role-appropriate responses
- Conversation builds on previous interactions

**Getting Specific Help**
- Ask about particular challenges or scenarios
- Request step-by-step guidance for implementation
- Seek recommendations for tools or strategies

**Accessing Your Data**
- Use phrases like "my projects" or "my cases"
- System automatically retrieves relevant CiviCRM data
- Responses include specific project details and recommendations

### 3. Advanced Features

**Project Management Support**
- Case status updates and next steps
- Client relationship guidance
- Resource allocation recommendations

**Strategic Planning**
- Organizational development advice
- Program design and evaluation
- Impact measurement strategies

**Technical Implementation**
- CiviCRM customization guidance
- Integration recommendations
- Workflow optimization

## Common Use Cases

### For MAS Clients

**Implementation Support**
- "How do I implement the governance recommendations from my MAS consultant?"
- "What's the best way to roll out our new volunteer management system?"
- "How should we approach our upcoming board retreat?"

**Follow-up Guidance**
- "I'm struggling with the fundraising strategy we discussed. Can you provide more specific steps?"
- "What are some examples of successful similar implementations?"
- "How do I measure the success of these changes?"

### For MAS Staff/Volunteer Consultants

**Client Project Management**
- "What's the status of my current projects?"
- "How should I approach the next phase of the Smith Foundation engagement?"
- "What resources are available for board development projects?"

**CiviCRM Support**
- "How do I set up automated thank-you emails for donations?"
- "What's the best way to track volunteer hours in CiviCRM?"
- "How should we configure case management for this client?"

**Consulting Best Practices**
- "What are effective approaches for organizations resistant to change?"
- "How do I help a client with limited technical capacity?"
- "What frameworks work best for strategic planning facilitation?"

### For Canadian Charity Staff

**Compliance and Regulations**
- "What are the current CRA requirements for charitable tax receipts?"
- "How do we ensure our fundraising activities are compliant?"
- "What reporting requirements do we need to meet?"

**Funding Opportunities**
- "What government grants are available for environmental charities?"
- "How do we identify foundation funding opportunities?"
- "What's the best approach for corporate sponsorship requests?"

**Sector-Specific Challenges**
- "How do we adapt our services for rural communities?"
- "What are effective strategies for bilingual communications?"
- "How do we navigate provincial vs. federal regulations?"

## Best Practices

### Getting Better Responses

**Be Specific**
- Provide context about your organization size, type, and challenges
- Mention specific constraints (budget, timeline, capacity)
- Share relevant background information

**Ask Follow-Up Questions**
- Request clarification on recommendations
- Ask for examples or case studies
- Seek implementation guidance

**Use Your Role Context**
- Mention your specific role and responsibilities
- Reference your organization's stage of development
- Highlight your particular expertise areas

### Maximizing CiviCRM Integration

**Authentication Benefits**
- Use Microsoft login for full feature access
- Ensure your email matches your CiviCRM contact record
- Keep your CiviCRM profile updated

**Query Optimization**
- Use specific project names or case numbers
- Ask about recent activities or upcoming deadlines
- Request status updates on ongoing work

**Data Privacy**
- Understand what data is accessed and how
- Only authenticated users can access CiviCRM data
- Personal project information is secure and private

### Continuous Learning

**Iterative Improvement**
- Build on previous conversations
- Refine your questions based on responses
- Develop specific implementation plans

**Resource Integration**
- Combine AI recommendations with MAS resources
- Cross-reference advice with sector best practices
- Validate recommendations with colleagues or supervisors

## Troubleshooting

### Common Issues

**Authentication Problems**
- Ensure you're using the correct Microsoft account
- Check that your email matches your CiviCRM contact
- Try signing out and back in if issues persist

**Data Access Issues**
- Verify you have the appropriate role permissions
- Confirm your CiviCRM contact record is active
- Check that you're assigned to the projects you're trying to access

**Response Quality**
- Provide more specific context in your questions
- Ask for clarification if responses seem generic
- Try rephrasing your question with more details

### Getting Help

**Within the Application**
- Use the feedback features to report issues
- Try different phrasings for your questions
- Experiment with more specific or general queries

**External Support**
- Contact MAS support for CiviCRM-related issues
- Reach out to your consultant for implementation guidance
- Use MAS resources and documentation for additional context

## Future Enhancements

### Planned Features
- Enhanced conversation memory
- File upload and analysis capabilities
- Advanced reporting and analytics
- Integration with additional nonprofit tools

### Feedback and Improvement
- Regular updates based on user feedback
- Continuous learning from successful implementations
- Expanded CiviCRM integration features
- Additional data sources and integrations

The MAS AI Assistant is designed to grow and improve with your organization's needs. Regular use and feedback help ensure it continues to provide valuable, actionable guidance for your nonprofit's success.