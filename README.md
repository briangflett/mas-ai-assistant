# MAS AI Assistant

A specialized conversational AI assistant designed to help nonprofits and social impact organizations maximize their effectiveness. Built with Next.js 15, the assistant provides intelligent, actionable advice on operations, fundraising, program delivery, volunteer management, and organizational development.

## Features

- **Role-based personalization** for MAS clients, staff/volunteer consultants, and Canadian charity team members
- **CiviCRM integration** for real-time project and case management data
- **Dual LLM strategy** using Claude and OpenAI for optimal response quality
- **Microsoft 365 authentication** for enhanced features and data access
- **Intelligent context awareness** that adapts to your specific organizational needs
- **Streaming responses** with token-by-token delivery for better user experience
- **RAG (Retrieval-Augmented Generation)** with nonprofit knowledge base
- **Modern AI SDK v5** integration with structured outputs and analytics
- **Persistent chat history** with PostgreSQL database storage
- **Message voting system** for continuous improvement
- **Suggested actions** for nonprofit workflow optimization

## Documentation

📖 **[Functional Guide](docs/FUNCTIONAL_GUIDE.md)** - Complete user guide with features, use cases, and best practices

🏗️ **[Architecture Documentation](docs/ARCHITECTURE.md)** - Technical architecture, design decisions, and system overview

🧪 **[Testing Guide](docs/TESTING.md)** - Comprehensive testing strategy using traditional and AI evaluation tools

🚀 **[Modern AI Enhancements](docs/MODERN_AI_ENHANCEMENTS.md)** - Latest AI SDK v5 features, streaming, RAG, and analytics

💬 **[Vercel Chatbot Features](docs/VERCEL_CHATBOT_FEATURES.md)** - Chat history, message voting, suggested actions, and analytics

📋 **[Feature Backlog](docs/BACKLOG.md)** - Future enhancements and feature ideas organized by priority

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm/bun
- Access to CiviCRM instance (for enhanced features)
- Microsoft 365 account (optional, for full feature access)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mas-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `OPENAI_API_KEY` - Your OpenAI API key  
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `AZURE_AD_CLIENT_ID` - Microsoft Azure AD client ID
- `AZURE_AD_CLIENT_SECRET` - Microsoft Azure AD client secret
- `AZURE_AD_TENANT_ID` - Microsoft Azure AD tenant ID

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### First-Time Setup

1. **Select Your Role**: Choose from MAS Client, MAS Staff/Volunteer Consultant, Canadian Charity Team Member, or Other
2. **Choose Your Topic**: Select your primary area of interest (AI, Planning, Governance, HR, Fundraising, etc.)
3. **Authentication**: Optionally sign in with Microsoft for enhanced features and CiviCRM integration

### Getting Help

Ask questions like:
- "What are my active projects?" (requires authentication)
- "How should I approach board development for a small nonprofit?"
- "What's the best way to implement a new donor database?"
- "Help me create a fundraising strategy for our upcoming campaign"

### CiviCRM Integration

For MAS Staff/Volunteer Consultants with Microsoft authentication:
- Access your active cases and project details
- Get client-specific recommendations
- View case activities and next steps
- Retrieve donor and contribution information

## Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Microsoft Azure AD
- **AI/LLM**: Claude (Anthropic), OpenAI GPT-4
- **CRM Integration**: CiviCRM API4, Model Context Protocol (MCP)
- **Deployment**: Vercel Platform

## Development

### Project Structure

```
mas-ai-assistant/
├── docs/                    # Documentation
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   └── lib/                 # Utilities and integrations
├── mcp-servers/
│   └── civicrm/            # CiviCRM MCP server
└── public/                 # Static assets
```

### Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run traditional unit/integration tests
- `npm run eval` - Run AI evaluation tests
- `npm run test:all` - Run all tests (traditional + AI evaluation)
- `npm run db:generate` - Generate database migration files
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open database management interface

### CiviCRM Integration

The application includes a custom CiviCRM client that uses API4 for all operations:

```typescript
// Example usage
const client = new CiviCRMClient({
  cvPath: '/path/to/cv',
  settingsPath: '/path/to/civicrm.settings.php'
});

const cases = await client.getCasesByRole(contactId, 'case_coordinator');
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# API Keys
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Microsoft Azure AD
AZURE_AD_CLIENT_ID=your_azure_client_id
AZURE_AD_CLIENT_SECRET=your_azure_client_secret
AZURE_AD_TENANT_ID=your_azure_tenant_id

# CiviCRM Configuration (optional)
CIVICRM_CV_PATH=/path/to/cv
CIVICRM_SETTINGS_PATH=/path/to/civicrm.settings.php
```

### CiviCRM Setup

For full CiviCRM integration:

1. Ensure CiviCRM is accessible via command line
2. Configure the CV tool path
3. Set up appropriate permissions for the application user
4. Test API access with the provided test script

## Support

- **Documentation**: See [docs/](docs/) directory
- **Issues**: Submit GitHub issues for bugs and feature requests
- **MAS Support**: Contact MAS for CiviCRM-related configuration help

## License

This project is private and proprietary to Management Advisory Services (MAS).

## About MAS

Management Advisory Services (MAS) is a nonprofit consulting organization that helps Canadian charities and nonprofits build capacity, improve operations, and increase their impact. Learn more at [masadvise.org](https://masadvise.org).