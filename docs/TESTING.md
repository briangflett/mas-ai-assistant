# Testing Guide for MAS AI Assistant

## Overview

This project uses a **hybrid testing approach** combining traditional deterministic testing with AI-specific evaluation tools to ensure both technical correctness and response quality.

## Testing Strategy

### 1. **Traditional Testing** (Deterministic Components)
- **Framework**: Vitest + React Testing Library
- **Purpose**: Test predictable, deterministic parts of the application
- **Coverage**: API endpoints, utility functions, component rendering, data transformations

### 2. **AI Evaluation** (Probabilistic Components)
- **Framework**: Evalite.dev
- **Purpose**: Evaluate AI response quality, relevance, and appropriateness
- **Coverage**: LLM responses, conversation flow, role-based personalization, CiviCRM integration

## Test Structure

```
src/test/
├── setup.ts                 # Global test setup
├── mocks/                   # Mock servers and data
│   └── server.ts            # MSW mock server
├── lib/                     # Unit tests for utilities
│   └── mcp-clients.test.ts  # MCP client logic tests
├── components/              # Component tests
│   └── onboarding.test.tsx  # Onboarding component tests
├── api/                     # API route tests
│   └── chat.test.ts         # Chat API endpoint tests
└── evals/                   # AI evaluation tests
    ├── response-quality.eval.ts      # Response quality evaluation
    └── civicrm-integration.eval.ts   # CiviCRM integration evaluation
```

## Running Tests

### Traditional Tests
```bash
# Run all traditional tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

### AI Evaluations
```bash
# Run AI evaluations
npm run eval

# Run evaluations with dev server
npm run eval:dev

# Run all tests (traditional + AI)
npm run test:all
```

## Test Categories

### 1. Unit Tests

#### MCP Clients (`src/test/lib/mcp-clients.test.ts`)
Tests the core orchestration logic:
- **Message analysis** - Correctly identifies when CiviCRM data is needed
- **LLM selection** - Chooses appropriate AI model based on query type
- **Role-based guidance** - Provides appropriate advice for different user roles
- **Context building** - Constructs proper prompts with user profile and history

#### CiviCRM Client (`mcp-servers/civicrm/src/test/civicrm-client.test.ts`)
Tests the CiviCRM integration:
- **API4 command building** - Constructs correct CiviCRM API calls
- **Data retrieval** - Fetches contacts, cases, contributions, events
- **Relationship queries** - Handles complex case coordinator relationships
- **Error handling** - Gracefully handles API failures
- **Data transformation** - Converts CiviCRM data to application format

### 2. Integration Tests

#### API Routes (`src/test/api/chat.test.ts`)
Tests the HTTP API endpoints:
- **Request validation** - Ensures required fields are present
- **Response format** - Returns correct response structure
- **Error handling** - Handles malformed requests and processing errors
- **Authentication** - Respects user authentication state

#### Component Tests (`src/test/components/onboarding.test.tsx`)
Tests React components:
- **Rendering** - Components render correctly
- **User interaction** - Handles clicks, form inputs, navigation
- **State management** - Updates component state appropriately
- **Authentication flow** - Handles Microsoft login integration

### 3. AI Evaluation Tests

#### Response Quality (`src/test/evals/response-quality.eval.ts`)
Evaluates AI response characteristics:
- **Relevance** - Responses address the user's question
- **Role appropriateness** - Tone and content match user role
- **Context awareness** - Maintains conversation context
- **Fallback handling** - Provides helpful responses when data unavailable
- **LLM selection** - Appropriate model chosen for query type

#### CiviCRM Integration (`src/test/evals/civicrm-integration.eval.ts`)
Evaluates CiviCRM data integration:
- **Data detection** - Correctly identifies when CiviCRM data needed
- **Personalization** - Uses actual user data in responses
- **Error resilience** - Handles CiviCRM failures gracefully
- **Data formatting** - Presents CiviCRM data in user-friendly format
- **Access control** - Respects user role permissions

## Writing Tests

### Traditional Tests Example

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MyComponent } from '../components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const onClickMock = vi.fn()
    render(<MyComponent onClick={onClickMock} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(onClickMock).toHaveBeenCalled()
  })
})
```

### AI Evaluation Example

```typescript
import { describe, it, expect } from 'evalite'
import { mcpClients } from '../../lib/mcp-clients'

describe('Response Quality', () => {
  it('should provide relevant fundraising advice', async () => {
    const response = await mcpClients.processMessage(
      'How should I approach major donors?',
      { userProfile: masClientProfile, previousMessages: [] }
    )

    expect(response).toContain('donor')
    expect(response).toContain('cultivation')
    expect(response.length).toBeGreaterThan(100)
  })
})
```

## Test Data and Mocks

### Mock Server (`src/test/mocks/server.ts`)
MSW (Mock Service Worker) configuration for:
- **Claude API** - Mocked Anthropic API responses
- **OpenAI API** - Mocked OpenAI API responses
- **Internal APIs** - Mocked internal chat API

### Test Profiles
Common user profiles used across tests:
```typescript
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
  microsoftSession: { /* session data */ }
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
      - run: npm run eval
```

## Test Environment Setup

### Environment Variables
Tests use these environment variables:
```bash
# Test environment
NODE_ENV=test

# Mock API keys (for testing)
ANTHROPIC_API_KEY=mock-claude-key
OPENAI_API_KEY=mock-openai-key

# Test authentication
NEXTAUTH_SECRET=test-secret
```

### CiviCRM Test Environment
For CiviCRM tests:
```bash
# Mock CiviCRM paths
CIVICRM_CV_PATH=/mock/cv
CIVICRM_SETTINGS_PATH=/mock/settings.php
```

## Performance Testing

### Response Time Benchmarks
```typescript
it('should respond within acceptable time limits', async () => {
  const startTime = Date.now()
  
  await mcpClients.processMessage('Test message', context)
  
  const responseTime = Date.now() - startTime
  expect(responseTime).toBeLessThan(30000) // 30 seconds max
})
```

### Memory Usage
Monitor memory usage during long conversations:
```typescript
it('should not leak memory during long conversations', async () => {
  const initialMemory = process.memoryUsage().heapUsed
  
  // Simulate long conversation
  for (let i = 0; i < 100; i++) {
    await mcpClients.processMessage(`Message ${i}`, context)
  }
  
  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory
  
  expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // 100MB max increase
})
```

## Debugging Tests

### Debug Mode
```bash
# Run specific test with debug output
npm run test -- --reporter=verbose MyComponent.test.tsx

# Run evaluation with debug info
npm run eval:dev
```

### Test Logging
Add debug logging to tests:
```typescript
it('should process message correctly', async () => {
  console.log('Testing message processing...')
  
  const response = await mcpClients.processMessage(message, context)
  
  console.log('Response:', response)
  expect(response).toBeDefined()
})
```

## Best Practices

### 1. **Test Isolation**
- Each test should be independent
- Use `beforeEach` to reset state
- Mock external dependencies

### 2. **Descriptive Test Names**
- Use clear, descriptive test names
- Follow "should [expected behavior] when [condition]" pattern
- Group related tests with `describe` blocks

### 3. **AI Evaluation Criteria**
- Test multiple aspects: relevance, accuracy, helpfulness
- Use realistic user scenarios
- Test edge cases and error conditions

### 4. **Continuous Improvement**
- Regularly update test scenarios
- Monitor test coverage and effectiveness
- Add tests for new features and bug fixes

### 5. **Performance Considerations**
- Mock expensive operations (API calls, CiviCRM queries)
- Use realistic but minimal test data
- Set appropriate timeouts for AI evaluations

## Troubleshooting

### Common Issues

**Test Timeouts**
- Increase timeout for AI evaluations
- Mock slow external APIs
- Check network connectivity

**Mock Failures**
- Ensure MSW server is properly configured
- Verify mock data matches expected format
- Check mock server is started in test setup

**CiviCRM Test Failures**
- Verify CiviCRM client mocks are working
- Check API4 command construction
- Ensure test data matches expected structure

### Getting Help

- Check test logs for detailed error messages
- Run tests in debug mode for more information
- Review mock server setup for API issues
- Consult Evalite.dev documentation for evaluation problems

## Future Enhancements

### Planned Testing Improvements
1. **Visual regression testing** for UI components
2. **End-to-end testing** with Playwright
3. **Performance benchmarking** with automated alerts
4. **A/B testing** framework for response quality
5. **Automated accessibility testing**
6. **Integration testing** with real CiviCRM instances

### Metrics and Monitoring
- Test coverage reporting
- Response quality trending
- Performance regression detection
- User satisfaction correlation with test results

This testing framework ensures both technical reliability and user experience quality for the MAS AI Assistant.