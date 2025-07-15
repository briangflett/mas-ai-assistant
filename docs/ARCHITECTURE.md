# MAS AI Assistant - Architecture Documentation

## Overview

The MAS AI Assistant is a Next.js-based conversational AI application designed to help nonprofits and social impact organizations maximize their effectiveness. It provides intelligent, actionable advice on operations, fundraising, program delivery, volunteer management, and organizational development.

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Onboarding    │  │  Chat Interface │  │  Authentication │  │
│  │   Component     │  │   Component     │  │   (NextAuth)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      API Routes (Next.js)                       │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   Chat API      │  │   Auth API      │                      │
│  │   /api/chat     │  │   /api/auth     │                      │
│  └─────────────────┘  └─────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   MCP Clients   │  │   Auth Config   │                      │
│  │   Orchestrator  │  │   Microsoft AD  │                      │
│  └─────────────────┘  └─────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│                     Data Access Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   CiviCRM MCP   │  │   LLM APIs      │                      │
│  │   Server        │  │   Claude/OpenAI │                      │
│  └─────────────────┘  └─────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│                     External Systems                            │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   CiviCRM       │  │   Microsoft     │                      │
│  │   Database      │  │   365 / Azure   │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Layer (Next.js 15 with App Router)

**Technologies:**
- React 19
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS 4
- Lucide React (icons)

**Key Components:**
- **Onboarding Component** (`src/components/onboarding.tsx`): Multi-step user role identification and preference setup
- **Chat Interface** (`src/components/chat-interface.tsx`): Real-time conversation interface with context awareness
- **Layout & Providers** (`src/app/layout.tsx`, `src/app/providers.tsx`): Application shell and context providers

### 2. API Routes Layer

**Authentication Route** (`src/app/api/auth/[...nextauth]/route.ts`):
- NextAuth.js integration
- Microsoft Azure AD authentication
- Session management

**Chat API Route** (`src/app/api/chat/route.ts`):
- Message processing endpoint
- Context-aware conversation handling
- Integration with MCP clients

### 3. Business Logic Layer

**MCP Clients Orchestrator** (`src/lib/mcp-clients.ts`):
- Central coordination of all external data sources
- User profile and context management
- LLM selection logic (Claude vs OpenAI)
- CiviCRM data integration

**Authentication Configuration** (`src/lib/auth.ts`):
- NextAuth.js configuration
- Microsoft Azure AD provider setup
- Session handling and token management

### 4. Data Access Layer

**CiviCRM Integration:**
- **MCP Server** (`mcp-servers/civicrm/`): Model Context Protocol server for CiviCRM
- **CiviCRM Client** (`mcp-servers/civicrm/src/civicrm-client.ts`): Direct CiviCRM API4 integration
- **MCP Wrapper** (`src/lib/mcp-civicrm.ts`): MCP protocol wrapper (currently bypassed)

**LLM Integration:**
- Claude API (Anthropic) - Primary for nonprofit consulting
- OpenAI GPT-4 - Secondary for technical/analytical tasks

## Data Flow

### User Onboarding Flow
1. User accesses the application
2. Onboarding component captures:
   - Role (MAS Client, MAS Staff/VC, Canadian Charity, Other)
   - Topic of interest
   - Identification method (Microsoft login, email, or anonymous)
3. User profile stored in localStorage
4. Microsoft authentication (optional) for enhanced data access

### Chat Conversation Flow
1. User sends message via chat interface
2. Chat API route receives message
3. MCP Clients orchestrator:
   - Analyzes message for CiviCRM data requirements
   - Fetches relevant CiviCRM data if needed
   - Selects appropriate LLM (Claude/OpenAI)
   - Constructs contextual prompt with user profile and data
4. LLM processes request and returns response
5. Response displayed in chat interface

### CiviCRM Data Integration Flow
1. Message analysis determines CiviCRM data needs
2. User identification via Microsoft session or email
3. CiviCRM client queries using API4:
   - Contact lookup by email
   - Case/project data retrieval
   - Relationship queries for role-based access
4. Data formatted and included in LLM prompt
5. Personalized response generated based on actual user data

## Key Design Decisions

### 1. Model Context Protocol (MCP)
- **Decision**: Implement MCP for CiviCRM integration
- **Current State**: Direct client usage due to transport issues
- **Rationale**: Provides standardized interface for external data sources
- **Future**: Re-enable MCP server when transport issues resolved

### 2. API4 Migration
- **Decision**: Migrate all CiviCRM API calls from API3 to API4
- **Rationale**: Better performance, consistency, and future-proofing
- **Implementation**: Complete conversion of all client methods

### 3. Dual LLM Strategy
- **Decision**: Use both Claude and OpenAI based on context
- **Claude**: Primary for nonprofit consulting, general advice
- **OpenAI**: Secondary for technical tasks, data analysis
- **Selection Logic**: Keyword-based routing in MCP clients

### 4. Role-Based Data Access
- **Decision**: Tiered data access based on user role and authentication
- **Anonymous**: Public information only
- **Email**: Basic personalization
- **Microsoft Auth**: Full access to CiviCRM data and templates

## Security Considerations

### Authentication
- Microsoft Azure AD integration for secure authentication
- Session-based access control
- Email-based contact matching for data access

### Data Protection
- No sensitive data stored in localStorage beyond user preferences
- API keys managed via environment variables
- CiviCRM access limited to authenticated users
- All external API calls use HTTPS

### Access Control
- Role-based feature access
- CiviCRM data access requires proper authentication
- Project data limited to case coordinator relationships

## Performance Considerations

### Frontend
- Next.js 15 with Turbopack for fast development builds
- React 19 with concurrent features
- Tailwind CSS for optimized styling

### Backend
- API4 for improved CiviCRM query performance
- Intelligent LLM selection to optimize response quality
- Efficient data fetching with targeted queries

### Caching
- Browser caching for static assets
- Session caching for user authentication
- No application-level caching (future consideration)

## Deployment Architecture

### Development
- Local development with Next.js dev server
- CiviCRM integration via buildkit environment
- Environment variables for API keys

### Production (Vercel)
- Next.js deployment on Vercel platform
- Environment variable management
- Automatic deployments from main branch

## Dependencies

### Core Framework
- Next.js 15.3.5 (React framework)
- React 19.0.0 (UI library)
- TypeScript 5 (Type safety)

### Authentication
- NextAuth.js 4.24.11 (Authentication)
- @auth/prisma-adapter 2.10.0 (Database adapter)

### AI/LLM Integration
- @anthropic-ai/sdk 0.56.0 (Claude API)
- OpenAI 5.9.0 (OpenAI API)
- ai 4.3.18 (AI utilities)

### CiviCRM Integration
- @modelcontextprotocol/sdk 1.15.1 (MCP protocol)
- Custom CiviCRM client (API4)

### UI/UX
- Tailwind CSS 4 (Styling)
- Lucide React 0.525.0 (Icons)

## Future Enhancements

### Short Term
1. Fix MCP transport issues and re-enable MCP server
2. Implement application-level caching
3. Add more sophisticated error handling
4. Enhance CiviCRM relationship mapping

### Medium Term
1. Add more data sources (other CRM systems)
2. Implement conversation memory/context persistence
3. Add file upload capabilities
4. Enhanced analytics and reporting

### Long Term
1. Multi-tenant support
2. Custom model fine-tuning
3. Advanced workflow automation
4. Integration with more nonprofit tools