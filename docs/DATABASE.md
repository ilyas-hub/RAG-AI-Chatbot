# Database Schema Reference

Source: `backend/prisma/schema.prisma`

## Enums

```
MessageRole:        USER | ASSISTANT | SYSTEM
EmbeddingStatus:    PENDING | PROCESSING | COMPLETED | FAILED
DocumentSourceType: MANUAL | URL | FILE_UPLOAD
```

## Tables

### ChatConversation

Stores chat sessions.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String (cuid) | auto | Primary key |
| userId | String | — | User identifier (or "anonymous") |
| sessionId | String | uuid | Unique session ID |
| title | String? | — | Auto-generated from first message |
| source | String | "web" | Origin: web, widget, api |
| metadata | Json? | — | Extra data |
| isActive | Boolean | true | False when ended |
| startedAt | DateTime | now() | — |
| endedAt | DateTime? | — | Set on end |

**Indexes:** userId, sessionId (unique)
**Relations:** messages -> ChatMessage[]

### ChatMessage

Individual messages in a conversation.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String (cuid) | auto | Primary key |
| conversationId | String | — | FK -> ChatConversation |
| userId | String? | — | — |
| role | MessageRole | — | USER, ASSISTANT, SYSTEM |
| content | Text | — | Full message text |
| embedding | Float[]? | — | Vector (unused currently) |
| tokenCount | Int? | — | Token usage |
| modelUsed | String? | — | LLM model ID |
| retrievedChunks | Json? | — | RAG context used |
| latencyMs | Int? | — | Response time |
| isHelpful | Boolean? | — | User feedback |
| feedbackText | String? | — | Optional feedback comment |
| createdAt | DateTime | now() | — |

**Indexes:** conversationId, userId
**Relations:** conversation -> ChatConversation

### FaqContent

FAQ entries managed by admin.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String (cuid) | auto | Primary key |
| category | String | — | e.g., "billing", "features" |
| question | String | — | FAQ question |
| answer | Text | — | FAQ answer |
| keywords | String[] | — | Search keywords |
| knowledgeBaseId | String? | — | FK -> KnowledgeBase (optional) |
| embeddingStatus | EmbeddingStatus | PENDING | Vector sync state |
| pineconeVectorId | String? | — | Vector ID in Pinecone |
| isActive | Boolean | true | — |
| helpfulCount | Int | 0 | — |
| createdAt | DateTime | now() | — |
| updatedAt | DateTime | auto | — |

**Indexes:** category, isActive, embeddingStatus
**Relations:** knowledgeBase -> KnowledgeBase?

### KnowledgeBase

Collections of documents/FAQs.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String (cuid) | auto | Primary key |
| name | String | — | Unique name |
| description | Text? | — | — |
| pineconeNamespace | String | — | Pinecone namespace |
| embeddingModel | String | "text-embedding-3-small" | — |
| isActive | Boolean | true | — |
| isDefault | Boolean | false | — |
| createdAt | DateTime | now() | — |
| updatedAt | DateTime | auto | — |

**Relations:** documents -> KnowledgeDocument[], faqContents -> FaqContent[]

### KnowledgeDocument

Documents uploaded to a knowledge base.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String (cuid) | auto | Primary key |
| knowledgeBaseId | String | — | FK -> KnowledgeBase |
| title | String | — | Document title |
| sourceType | DocumentSourceType | — | MANUAL, URL, FILE_UPLOAD |
| sourceFileKey | String? | — | File storage key |
| content | Text | — | Full document text |
| contentHash | String? | — | SHA-256 for dedup |
| chunkCount | Int | 0 | Number of chunks |
| embeddingStatus | EmbeddingStatus | PENDING | — |
| lastEmbeddedAt | DateTime? | — | — |
| errorMessage | String? | — | Error details if FAILED |
| isActive | Boolean | true | — |
| createdAt | DateTime | now() | — |
| updatedAt | DateTime | auto | — |

**Indexes:** knowledgeBaseId, embeddingStatus
**Relations:** knowledgeBase -> KnowledgeBase

### ChatbotConfig

Singleton configuration table.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String | "default" | Singleton key |
| isEnabled | Boolean | true | Kill switch |
| welcomeMessage | String | "Hello! How can I help you today?" | — |
| fallbackMessage | String | "I'm having trouble..." | — |
| primaryModel | String | "nvidia/nemotron-3-nano-30b-a3b:free" | — |
| fallbackModel | String | "arcee-ai/trinity-mini:free" | — |
| temperature | Float | 0.3 | — |
| maxTokens | Int | 1024 | — |
| rateLimitPerMinute | Int | 20 | — |
| allowAnonymous | Boolean | true | — |
| enableFeedback | Boolean | true | — |
| customInstructions | Text? | — | Extra system prompt text |
| widgetApiKey | String? | — | For external embeds (unique) |
| createdAt | DateTime | now() | — |
| updatedAt | DateTime | auto | — |

### PromptTemplate

Versioned prompt templates.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String (cuid) | auto | Primary key |
| name | String | — | Template name |
| version | Int | 1 | — |
| content | Text | — | Template with {{variables}} |
| variables | String[] | — | Variable names |
| isActive | Boolean | true | — |
| createdAt | DateTime | now() | — |
| updatedAt | DateTime | auto | — |

**Constraint:** unique(name, version)

## Common Queries

```bash
# Open visual database browser
cd backend && npx prisma studio --schema=prisma/schema.prisma

# Reset config to defaults (delete then auto-recreates)
DELETE FROM chatbot_config;

# Check FAQ embedding status
SELECT category, question, embedding_status FROM faq_content;

# Check document chunk counts
SELECT title, chunk_count, embedding_status FROM knowledge_document;

# View conversation stats
SELECT COUNT(*) as total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active FROM chat_conversation;
```

Note: Prisma model names are PascalCase but PostgreSQL table names are snake_case.
