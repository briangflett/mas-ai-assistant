# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **MAS AI Assistant** - a Next.js application that provides AI-powered consulting support for nonprofit organizations. The application uses role-based onboarding to tailor responses for different user types (MAS clients, staff/volunteer consultants, Canadian charity workers).

## Core Architecture

### Application Structure
- **Next.js 15** with App Router using TypeScript and React 19
- **Tailwind CSS** for styling with custom gradients and animations
- **API Routes** for backend functionality (`/api/chat`)
- **Client-side routing** with localStorage for user profile persistence

### Key Components
- **Onboarding Flow** (`src/components/onboarding.tsx`): Multi-step role selection, topic selection, and identification
- **Chat Interface** (`src/components/chat-interface.tsx`): Real-time chat with contextual responses
- **MCP Clients** (`src/lib/mcp-clients.ts`): AI service integration with role-specific prompt engineering

### Data Flow
1. User completes onboarding → Profile stored in localStorage
2. Chat messages → API route (`/api/chat`) → MCP client processing
3. Context includes user profile + recent message history
4. AI responses tailored to user role and data access level

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Key Features

### Role-Based Access
- **MAS Client**: Basic nonprofit consulting support
- **MAS Staff/VC**: Enhanced access to templates and project history with Microsoft login
- **Canadian Charity**: Canada-specific nonprofit guidance
- **Other**: General nonprofit support with custom role specification

### Data Access Levels
- **Public**: Basic publicly available information
- **Enhanced**: VC Templates + Project History (MAS Staff with Microsoft login)

### AI Integration
- **Anthropic Claude API** integration via `src/lib/mcp-clients.ts`
- **Contextual prompting** based on user role and conversation history
- **Fallback responses** for API failures with role-specific guidance

## Environment Variables

Required environment variables:
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude integration

## Deployment

Configured for **Vercel** deployment with:
- 30-second timeout for chat API route
- Environment variable mapping for Anthropic API key

## TypeScript Configuration

- **Path aliases**: `@/*` maps to `./src/*`
- **Strict mode** enabled
- **Next.js plugin** for enhanced TypeScript support