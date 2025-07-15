import { setupServer } from 'msw/node'
import { rest } from 'msw'

export const handlers = [
  // Mock Claude API
  rest.post('https://api.anthropic.com/v1/messages', (req, res, ctx) => {
    return res(
      ctx.json({
        content: [{
          text: 'This is a mocked Claude response for testing purposes.'
        }]
      })
    )
  }),

  // Mock OpenAI API
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(
      ctx.json({
        choices: [{
          message: {
            content: 'This is a mocked OpenAI response for testing purposes.'
          }
        }]
      })
    )
  }),

  // Mock internal chat API
  rest.post('/api/chat', (req, res, ctx) => {
    return res(
      ctx.json({
        response: 'This is a mocked chat response for testing purposes.'
      })
    )
  }),
]

export const server = setupServer(...handlers)