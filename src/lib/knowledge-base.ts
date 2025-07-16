import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'

// Knowledge base for MAS-specific content and nonprofit resources
export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  category: 'governance' | 'fundraising' | 'operations' | 'civicrm' | 'planning' | 'hr' | 'marketing'
  tags: string[]
  embedding?: number[]
  lastUpdated: Date
}

// Sample knowledge base entries
const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: 'governance-101',
    title: 'Nonprofit Governance Best Practices',
    content: `Effective nonprofit governance requires clear roles and responsibilities. The board should focus on strategic oversight while management handles day-to-day operations. Key components include:

1. Board Composition: Diverse skills, experience, and perspectives
2. Clear Policies: Conflict of interest, financial oversight, executive compensation
3. Regular Meetings: Structured agendas, proper documentation
4. Financial Oversight: Budget approval, audit review, financial monitoring
5. Strategic Planning: Long-term vision, goal setting, performance measurement

Common governance challenges include board engagement, succession planning, and balancing oversight with support for management.`,
    category: 'governance',
    tags: ['board', 'oversight', 'policies', 'strategic planning'],
    lastUpdated: new Date('2024-01-15')
  },
  {
    id: 'fundraising-strategy',
    title: 'Comprehensive Fundraising Strategy Framework',
    content: `A successful fundraising strategy requires multiple revenue streams and donor stewardship:

1. Individual Giving: Annual campaigns, major gifts, planned giving
2. Foundation Grants: Research, relationship building, proposal writing
3. Corporate Partnerships: Sponsorships, employee giving, cause marketing
4. Events: Galas, peer-to-peer fundraising, community events
5. Online Fundraising: Website donations, social media campaigns, crowdfunding

Key principles: Donor retention costs less than acquisition, storytelling drives engagement, data tracking improves results. Focus on building relationships, not just transactions.`,
    category: 'fundraising',
    tags: ['donors', 'grants', 'events', 'online', 'stewardship'],
    lastUpdated: new Date('2024-01-10')
  },
  {
    id: 'civicrm-implementation',
    title: 'CiviCRM Implementation Guide',
    content: `CiviCRM implementation requires careful planning and phased approach:

Planning Phase:
- Assess current systems and data
- Define requirements and workflows
- Plan data migration strategy
- Identify customization needs

Implementation Phase:
- Install and configure CiviCRM
- Set up contact types and custom fields
- Configure contribution and membership settings
- Create event and case management workflows
- Import and clean data

Training Phase:
- Staff training on core functionality
- Admin training for ongoing management
- Create documentation and procedures
- Establish backup and maintenance routines

Best practices: Start simple, train thoroughly, maintain data quality, leverage community support.`,
    category: 'civicrm',
    tags: ['implementation', 'migration', 'training', 'configuration'],
    lastUpdated: new Date('2024-01-05')
  },
  {
    id: 'volunteer-management',
    title: 'Effective Volunteer Management Strategies',
    content: `Volunteer management is crucial for nonprofit success and requires systematic approach:

Recruitment:
- Clear role descriptions and expectations
- Multiple recruitment channels (website, social media, partnerships)
- Skills-based matching
- Inclusive and accessible opportunities

Onboarding:
- Welcome orientation and training
- Background checks where appropriate
- Clear policies and procedures
- Mentor assignments for new volunteers

Retention:
- Regular recognition and appreciation
- Meaningful work assignments
- Growth and development opportunities
- Flexible scheduling and remote options
- Regular feedback and communication

Volunteer engagement statistics show that 68% of volunteers stop due to poor management, making effective systems essential.`,
    category: 'hr',
    tags: ['volunteers', 'recruitment', 'retention', 'training'],
    lastUpdated: new Date('2024-01-12')
  }
]

export class KnowledgeBase {
  private documents: KnowledgeDocument[]
  private embeddingsGenerated: boolean = false

  constructor() {
    this.documents = [...knowledgeDocuments]
  }

  async generateEmbeddings() {
    if (this.embeddingsGenerated) return

    console.log('Generating embeddings for knowledge base...')
    
    for (const doc of this.documents) {
      try {
        const { embedding } = await embed({
          model: openai.embedding('text-embedding-3-small'),
          value: `${doc.title}\\n\\n${doc.content}`
        })
        doc.embedding = embedding
      } catch (error) {
        console.error(`Failed to generate embedding for ${doc.id}:`, error)
      }
    }

    this.embeddingsGenerated = true
    console.log('Embeddings generated for', this.documents.length, 'documents')
  }

  async findRelevantDocuments(query: string, limit: number = 3): Promise<KnowledgeDocument[]> {
    if (!this.embeddingsGenerated) {
      await this.generateEmbeddings()
    }

    try {
      // Generate embedding for the query
      const { embedding: queryEmbedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: query
      })

      // Calculate similarity scores
      const scoredDocuments = this.documents
        .filter(doc => doc.embedding)
        .map(doc => ({
          document: doc,
          similarity: this.cosineSimilarity(queryEmbedding, doc.embedding!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)

      return scoredDocuments.map(item => item.document)
    } catch (error) {
      console.error('Error finding relevant documents:', error)
      return []
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }

  async searchByCategory(category: KnowledgeDocument['category']): Promise<KnowledgeDocument[]> {
    return this.documents.filter(doc => doc.category === category)
  }

  async searchByTags(tags: string[]): Promise<KnowledgeDocument[]> {
    return this.documents.filter(doc => 
      tags.some(tag => doc.tags.includes(tag.toLowerCase()))
    )
  }

  async addDocument(document: Omit<KnowledgeDocument, 'id' | 'lastUpdated'>): Promise<void> {
    const newDoc: KnowledgeDocument = {
      ...document,
      id: `doc-${Date.now()}`,
      lastUpdated: new Date()
    }

    // Generate embedding for new document
    try {
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: `${newDoc.title}\\n\\n${newDoc.content}`
      })
      newDoc.embedding = embedding
    } catch (error) {
      console.error('Failed to generate embedding for new document:', error)
    }

    this.documents.push(newDoc)
  }

  getDocumentById(id: string): KnowledgeDocument | undefined {
    return this.documents.find(doc => doc.id === id)
  }

  getAllDocuments(): KnowledgeDocument[] {
    return [...this.documents]
  }

  getCategories(): string[] {
    return [...new Set(this.documents.map(doc => doc.category))]
  }

  async getContextForQuery(query: string, userRole: string): Promise<string> {
    const relevantDocs = await this.findRelevantDocuments(query, 2)
    
    if (relevantDocs.length === 0) {
      return ''
    }

    const context = relevantDocs.map(doc => `
**${doc.title}**
${doc.content}
    `).join('\\n\\n')

    return `
Relevant Knowledge Base Information:
${context}

Please use this information to provide accurate, helpful advice tailored to ${userRole} needs.
    `
  }
}

// Singleton instance
export const knowledgeBase = new KnowledgeBase()