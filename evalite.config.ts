import { defineConfig } from 'evalite'

export default defineConfig({
  // Optional: Configure your evaluation settings
  // This will be used for AI response evaluation
  
  // You can specify different LLMs for evaluation
  // models: ['gpt-4', 'claude-3-sonnet'],
  
  // Configure output formats
  // outputFormats: ['json', 'html'],
  
  // Set up evaluation criteria
  // criteria: {
  //   relevance: 'How relevant is the response to the user query?',
  //   accuracy: 'How accurate is the information provided?',
  //   helpfulness: 'How helpful is the response for the user?',
  //   roleAppropriate: 'Is the response appropriate for the user role?'
  // }
})