# API Reference

Base URL: `http://localhost:3000`

## Health Check

```
GET /health
Response: { status: "ok" }
```

---

## User-Facing Endpoints

No authentication required (anonymous access).

### Send Message (Streaming)

```
POST /chatbot/chat
Content-Type: application/json

Body:
{
  "message": "What is your return policy?",
  "conversationId": "clxyz123...",   // optional, creates new if omitted
  "source": "web"                     // optional, default "web"
}

Response: text/plain (SSE stream)
```

### Create Conversation

```
POST /chatbot/conversations
Content-Type: application/json

Body:
{
  "source": "web"    // optional
}

Response:
{
  "success": true,
  "data": {
    "id": "clxyz123...",
    "sessionId": "uuid",
    "isActive": true,
    "startedAt": "2026-03-09T..."
  }
}
```

### List Conversations

```
GET /chatbot/conversations?page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "conversations": [...],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### Get Messages

```
GET /chatbot/conversations/:id/messages

Response:
{
  "success": true,
  "data": [
    {
      "id": "msg_123",
      "role": "USER",
      "content": "Hello",
      "createdAt": "2026-03-09T..."
    },
    {
      "id": "msg_124",
      "role": "ASSISTANT",
      "content": "Hi! How can I help?",
      "modelUsed": "nvidia/nemotron-3-nano-30b-a3b:free",
      "tokenCount": 15,
      "latencyMs": 1200
    }
  ]
}
```

### End Conversation

```
DELETE /chatbot/conversations/:id

Response:
{ "success": true, "data": { "message": "Conversation ended" } }
```

### Submit Feedback

```
POST /chatbot/feedback
Content-Type: application/json

Body:
{
  "messageId": "msg_124",
  "isHelpful": true,
  "feedbackText": "Very accurate!"   // optional
}

Response:
{ "success": true, "data": { "message": "Feedback recorded" } }
```

### Get Public Config

```
GET /chatbot/config

Response:
{
  "success": true,
  "data": {
    "isEnabled": true,
    "welcomeMessage": "Hello! How can I help?",
    "enableFeedback": true
  }
}
```

---

## Admin Endpoints

All admin endpoints require `X-Admin-Secret` header.

```
Headers:
  X-Admin-Secret: your-admin-secret
```

### Knowledge Bases

```
GET    /chatbot/admin/knowledge-bases          # List all
POST   /chatbot/admin/knowledge-bases          # Create
PUT    /chatbot/admin/knowledge-bases/:id      # Update
DELETE /chatbot/admin/knowledge-bases/:id      # Delete (+ vectors)

Create/Update Body:
{
  "name": "Product Docs",
  "description": "Product documentation",
  "isDefault": true
}
```

### Documents

```
POST   /chatbot/admin/knowledge-bases/:id/documents   # Upload
DELETE /chatbot/admin/documents/:id                     # Delete (+ vectors)

Upload Body:
{
  "title": "Getting Started Guide",
  "content": "Full document text here...",
  "sourceType": "MANUAL"   // MANUAL | URL | FILE_UPLOAD
}
```

### FAQs

```
GET    /chatbot/admin/faq             # List (with pagination)
POST   /chatbot/admin/faq             # Create (auto-embeds to Pinecone)
PUT    /chatbot/admin/faq/:id         # Update (re-embeds)
DELETE /chatbot/admin/faq/:id         # Delete (+ removes vector)
POST   /chatbot/admin/faq/sync        # Bulk sync all FAQs to Pinecone

Create/Update Body:
{
  "category": "billing",
  "question": "How do I cancel my subscription?",
  "answer": "Go to Settings > Billing > Cancel plan.",
  "keywords": ["cancel", "subscription", "billing"],
  "knowledgeBaseId": "kb_123"   // optional
}
```

### Config

```
GET /chatbot/admin/config       # Get full config
PUT /chatbot/admin/config       # Update config

Update Body:
{
  "isEnabled": true,
  "welcomeMessage": "Hi! Ask me anything.",
  "fallbackMessage": "Sorry, something went wrong.",
  "primaryModel": "nvidia/nemotron-3-nano-30b-a3b:free",
  "fallbackModel": "arcee-ai/trinity-mini:free",
  "temperature": 0.3,
  "maxTokens": 1024,
  "rateLimitPerMinute": 20,
  "allowAnonymous": true,
  "enableFeedback": true,
  "customInstructions": "Always be professional."
}
```

### Analytics

```
GET /chatbot/admin/analytics

Response:
{
  "success": true,
  "data": {
    "totalConversations": 150,
    "totalMessages": 1200,
    "avgMessagesPerConversation": 8,
    "feedbackStats": {
      "total": 45,
      "helpful": 38,
      "notHelpful": 7
    },
    "topCategories": [
      { "category": "billing", "count": 12 },
      { "category": "features", "count": 8 }
    ]
  }
}
```

### Reindex

```
POST /chatbot/admin/reindex

Response:
{
  "success": true,
  "data": {
    "faqs": 25,
    "documents": 10
  }
}
```

---

## External Widget Endpoints

For embedding the chatbot in external sites (WordPress, etc.). Uses API key auth.

```
Headers:
  X-Widget-Key: your-widget-api-key
```

```
POST /chatbot/external/chat               # Send message (SSE)
POST /chatbot/external/conversations       # Start conversation
GET  /chatbot/external/config              # Get widget config
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

Common status codes:
- `400` Bad Request (validation failed)
- `401` Unauthorized (missing/invalid auth)
- `404` Not Found
- `429` Too Many Requests (rate limited)
- `500` Internal Server Error
