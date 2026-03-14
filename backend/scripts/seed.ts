/**
 * Database Seed Script
 *
 * Usage:
 *   npm run db:seed          — Wipe + seed all data
 *   npm run db:unseed        — Wipe all data
 *   tsx scripts/seed.ts seed
 *   tsx scripts/seed.ts unseed
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client-metadata';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ─── SEED DATA ──────────────────────────────────────────────

const KNOWLEDGE_BASES = [
  {
    name: 'Product Documentation',
    description: 'Core product features, guides, and how-to documentation for end users.',
    pineconeNamespace: 'global',
    isDefault: true,
  },
  {
    name: 'Company Policies',
    description: 'Internal company policies including billing, refunds, privacy, and terms of service.',
    pineconeNamespace: 'global',
    isDefault: false,
  },
];

const FAQS = [
  // ── Billing (8 FAQs) ──
  {
    category: 'billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept Visa, Mastercard, American Express, PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe with PCI DSS Level 1 compliance.',
    keywords: ['payment', 'credit card', 'paypal', 'stripe', 'bank transfer'],
  },
  {
    category: 'billing',
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings → Billing → click "Cancel Plan". Your access continues until the end of your current billing period. No partial refunds are issued for monthly plans, but annual plans are eligible for a prorated refund within the first 30 days.',
    keywords: ['cancel', 'subscription', 'refund', 'unsubscribe'],
  },
  {
    category: 'billing',
    question: 'Can I get a refund?',
    answer: 'Monthly plans: No refunds after the billing cycle starts. Annual plans: Full refund within 14 days of purchase, prorated refund within 30 days. Enterprise plans: Contact your account manager. To request a refund, email billing@example.com with your account ID.',
    keywords: ['refund', 'money back', 'return', 'chargeback'],
  },
  {
    category: 'billing',
    question: 'How do I upgrade or downgrade my plan?',
    answer: 'Go to Settings → Billing → "Change Plan". Upgrades take effect immediately and you\'ll be charged the prorated difference. Downgrades take effect at the next billing cycle. Enterprise customers should contact their account manager.',
    keywords: ['upgrade', 'downgrade', 'change plan', 'switch plan'],
  },
  {
    category: 'billing',
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes! Annual billing saves you 20% compared to monthly. For example, our Pro plan is $29/month billed monthly, or $23.20/month billed annually ($278.40/year). Education and non-profit discounts of 50% are also available — contact sales@example.com.',
    keywords: ['discount', 'annual', 'yearly', 'education', 'non-profit', 'pricing'],
  },
  {
    category: 'billing',
    question: 'Where can I find my invoices?',
    answer: 'All invoices are available at Settings → Billing → "Invoice History". You can download individual invoices as PDFs or set up automatic invoice forwarding to your accounting email. Invoices are generated on the 1st of each month.',
    keywords: ['invoice', 'receipt', 'billing history', 'pdf'],
  },
  {
    category: 'billing',
    question: 'What happens if my payment fails?',
    answer: 'We retry failed payments 3 times over 7 days. You\'ll receive email notifications after each failed attempt. If all retries fail, your account is downgraded to the free tier (data preserved for 30 days). Update your payment method at Settings → Billing to restore your plan instantly.',
    keywords: ['payment failed', 'card declined', 'retry', 'expired card'],
  },
  {
    category: 'billing',
    question: 'Is there a free trial?',
    answer: 'Yes, we offer a 14-day free trial of our Pro plan with no credit card required. You get full access to all Pro features. At the end of the trial, you can choose to subscribe or continue on our free tier with limited features.',
    keywords: ['free trial', 'trial', 'demo', 'try free'],
  },

  // ── Features (8 FAQs) ──
  {
    category: 'features',
    question: 'What are the main features of the platform?',
    answer: 'Our platform includes: (1) AI-powered chatbot with RAG for accurate, context-aware responses; (2) Knowledge base management with document upload and FAQ creation; (3) Real-time analytics dashboard; (4) Multi-model AI support (switch between LLMs); (5) Embeddable widget for any website; (6) Rate limiting and security controls; (7) User feedback collection with satisfaction tracking.',
    keywords: ['features', 'capabilities', 'what can it do', 'overview'],
  },
  {
    category: 'features',
    question: 'How does the AI chatbot work?',
    answer: 'Our chatbot uses Retrieval-Augmented Generation (RAG). When a user asks a question, we: (1) Convert the question into a vector embedding; (2) Search our vector database for the most relevant knowledge base content; (3) Inject the relevant context into the AI prompt; (4) Stream the AI\'s response in real-time. This ensures answers are grounded in your actual data, reducing hallucinations.',
    keywords: ['ai', 'chatbot', 'how it works', 'rag', 'retrieval'],
  },
  {
    category: 'features',
    question: 'Can I customize the chatbot\'s personality?',
    answer: 'Yes! Go to Admin → Settings → "Custom Instructions". You can add instructions like "Always respond in a formal tone" or "Focus only on product-related questions". The custom instructions are injected into every conversation. You can also change the welcome message, fallback message, and temperature (creativity level).',
    keywords: ['customize', 'personality', 'tone', 'instructions', 'persona'],
  },
  {
    category: 'features',
    question: 'What file formats can I upload to the knowledge base?',
    answer: 'Currently we support plain text content pasted directly into the upload form. Supported source types are: Manual (paste text), URL (paste webpage content), and File Upload (paste extracted text). We automatically chunk large documents into optimal segments for AI retrieval. PDF and DOCX direct upload support is coming soon.',
    keywords: ['upload', 'file format', 'document', 'pdf', 'knowledge base'],
  },
  {
    category: 'features',
    question: 'How do I embed the chatbot on my website?',
    answer: 'Go to Admin → Settings and copy your Widget API Key. Then add this script to your website\'s HTML before the closing </body> tag: <script src="https://your-domain.com/widget.js" data-api-key="YOUR_KEY"></script>. The widget appears as a floating button in the bottom-right corner. Styling is automatically applied.',
    keywords: ['embed', 'widget', 'website', 'install', 'script', 'wordpress'],
  },
  {
    category: 'features',
    question: 'Does the chatbot support multiple languages?',
    answer: 'The AI model can respond in any language the user writes in — it automatically detects and matches the language. However, your knowledge base content should be in the language you want the best accuracy for. For multilingual support, we recommend creating separate FAQ entries in each target language.',
    keywords: ['language', 'multilingual', 'translation', 'international'],
  },
  {
    category: 'features',
    question: 'Can I switch between different AI models?',
    answer: 'Yes! Go to Admin → Settings → "AI Models". You can choose a Primary Model and a Fallback Model from 40+ available models on OpenRouter, including free options. The system automatically falls back to the secondary model if the primary fails. Models are organized by tier: Free, Budget, Standard, and Premium.',
    keywords: ['model', 'ai model', 'switch model', 'openrouter', 'llm'],
  },
  {
    category: 'features',
    question: 'How accurate are the chatbot responses?',
    answer: 'Accuracy depends on your knowledge base quality. With well-written FAQs and documents, our RAG pipeline achieves 85-95% relevance. The system uses a confidence threshold (default 0.72) — if no knowledge base content is relevant enough, the AI clearly labels its response as "from general knowledge". You can monitor accuracy through the feedback analytics in the admin panel.',
    keywords: ['accuracy', 'hallucination', 'relevance', 'confidence', 'quality'],
  },

  // ── Account (6 FAQs) ──
  {
    category: 'account',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the login page, enter your email, and we\'ll send a reset link valid for 1 hour. If you don\'t receive the email, check your spam folder. For security, password reset links can only be used once. If you still have issues, contact support@example.com.',
    keywords: ['password', 'reset', 'forgot', 'login', 'locked out'],
  },
  {
    category: 'account',
    question: 'How do I delete my account?',
    answer: 'Go to Settings → Account → "Delete Account". This permanently removes all your data including conversations, knowledge bases, documents, and FAQs. This action cannot be undone. We retain anonymized analytics data for 30 days. For GDPR data requests, email privacy@example.com.',
    keywords: ['delete account', 'remove', 'gdpr', 'data deletion', 'close account'],
  },
  {
    category: 'account',
    question: 'Can I have multiple team members on one account?',
    answer: 'Yes, on Pro and Enterprise plans. Go to Settings → Team → "Invite Member". Team members can have Admin (full access) or Viewer (read-only analytics) roles. Free plan is limited to 1 user. Pro allows up to 5 team members. Enterprise has unlimited seats.',
    keywords: ['team', 'invite', 'collaboration', 'members', 'seats', 'roles'],
  },
  {
    category: 'account',
    question: 'Is my data secure?',
    answer: 'Yes. We use: (1) AES-256 encryption at rest; (2) TLS 1.3 for data in transit; (3) SOC 2 Type II compliant infrastructure; (4) Regular penetration testing; (5) API keys are hashed, never stored in plain text; (6) Rate limiting to prevent abuse; (7) GDPR and CCPA compliant data handling. Your knowledge base data is isolated per account.',
    keywords: ['security', 'encryption', 'gdpr', 'privacy', 'data protection', 'soc2'],
  },
  {
    category: 'account',
    question: 'What are the API rate limits?',
    answer: 'Default: 20 requests per minute per user. Configurable in Admin → Settings → "Rate Limit /min". Free plan: 20 req/min. Pro plan: 100 req/min. Enterprise: custom limits. Rate-limited requests receive a 429 status code with a Retry-After header. The chatbot widget handles rate limiting gracefully with a user-friendly message.',
    keywords: ['rate limit', 'api limit', 'throttle', '429', 'requests per minute'],
  },
  {
    category: 'account',
    question: 'Do you offer an API for integration?',
    answer: 'Yes! Our REST API supports: (1) Chat with streaming (SSE); (2) Conversation management (create, list, delete); (3) Knowledge base CRUD; (4) FAQ management; (5) Configuration updates; (6) Analytics retrieval. Authentication is via API key or JWT. Full API documentation is available at /docs/API.md in the repository.',
    keywords: ['api', 'integration', 'rest', 'endpoints', 'developer', 'sdk'],
  },

  // ── Technical / Troubleshooting (5 FAQs) ──
  {
    category: 'troubleshooting',
    question: 'The chatbot is not responding. What should I do?',
    answer: 'Try these steps: (1) Check if the chatbot is enabled in Admin → Settings; (2) Verify your API keys are valid (OpenRouter, Pinecone); (3) Check the backend health endpoint at /health; (4) Look at browser DevTools → Network tab for errors; (5) If using free models, you may be rate-limited — wait 1 minute and retry. If the issue persists, check backend logs for specific error messages.',
    keywords: ['not working', 'no response', 'error', 'broken', 'debug'],
  },
  {
    category: 'troubleshooting',
    question: 'Why are the chatbot responses slow?',
    answer: 'Common causes: (1) Free AI models are slower than paid ones — consider upgrading; (2) Cold start on free hosting (Render) takes ~30 seconds; (3) Large knowledge base searches can take longer; (4) Network latency to AI providers. You can check response latency in Admin → Analytics. Typical response times: Free models 2-5s, Paid models 0.5-2s.',
    keywords: ['slow', 'latency', 'performance', 'speed', 'timeout'],
  },
  {
    category: 'troubleshooting',
    question: 'My FAQs are not appearing in chat responses. Why?',
    answer: 'Check: (1) Go to Admin → FAQ tab — is the embedding status "COMPLETED"? If "PENDING", click "Sync to Pinecone"; (2) If "FAILED", verify your Pinecone and OpenRouter API keys; (3) The similarity threshold (default 0.72) might be too high — try lowering it in settings; (4) Make sure the FAQ is marked as "Active"; (5) Try asking the exact question from your FAQ to test.',
    keywords: ['faq not working', 'embedding failed', 'sync', 'pinecone', 'not found'],
  },
  {
    category: 'troubleshooting',
    question: 'How do I check system health?',
    answer: 'Visit /health on your backend URL (e.g., https://your-api.onrender.com/health). It returns {"status":"ok"} if the server is running. For detailed diagnostics: (1) Check Prisma Studio for database status; (2) Check Pinecone dashboard for vector count; (3) Check OpenRouter dashboard for API usage; (4) Check Upstash dashboard for Redis status.',
    keywords: ['health', 'status', 'monitoring', 'diagnostics', 'uptime'],
  },
  {
    category: 'troubleshooting',
    question: 'Can I migrate from another chatbot platform?',
    answer: 'Yes! Export your existing FAQs as CSV/JSON, then use our Admin panel to bulk-create them. For each FAQ, you\'ll need: category, question, answer, and optional keywords. After importing, click "Sync to Pinecone" to embed all FAQs. For large migrations (1000+ FAQs), contact us for bulk import assistance.',
    keywords: ['migrate', 'import', 'export', 'switch', 'transfer', 'csv'],
  },
];

const DOCUMENTS = [
  {
    kbName: 'Product Documentation',
    title: 'Getting Started Guide',
    sourceType: 'MANUAL' as const,
    content: `Getting Started with RAG AI Chatbot

Welcome to the RAG AI Chatbot platform! This guide will help you set up your first AI-powered chatbot in under 10 minutes.

Step 1: Access the Admin Panel
Navigate to your deployment URL and add #admin to the end (e.g., https://your-site.com/#admin). Enter your admin secret to log in.

Step 2: Configure Your Chatbot
Go to the Settings tab to customize:
- Welcome Message: The first message users see when they open the chat widget.
- AI Model: Choose from 40+ models. We recommend starting with a free model for testing.
- Temperature: Controls creativity. Lower (0.1-0.3) for factual responses, higher (0.7-1.0) for creative ones.
- Custom Instructions: Add personality or constraints like "Always respond in a friendly, professional tone."

Step 3: Add Your Knowledge Base
Go to the Knowledge Bases tab and create your first knowledge base. Then add documents by clicking "Upload Document" on any knowledge base card. Paste your content — the system automatically chunks and embeds it for AI retrieval.

Step 4: Create FAQs
Go to the FAQ tab and click "New FAQ". Add your most common questions with detailed answers. Each FAQ is automatically embedded to the vector database for semantic search. Use descriptive categories and keywords for better organization.

Step 5: Test Your Chatbot
Open the main page (without #admin) and click the chat bubble in the bottom-right corner. Ask questions related to your knowledge base to verify the AI responds with relevant, accurate answers.

Step 6: Monitor Performance
Use the Analytics tab to track conversation counts, message volumes, and user satisfaction rates. The feedback breakdown shows how users rate the chatbot's responses.

Tips for Best Results:
- Write clear, detailed FAQ answers — the AI can only be as good as your knowledge base.
- Use specific keywords to improve search relevance.
- Keep the temperature low (0.2-0.4) for factual, support-oriented chatbots.
- Regularly review feedback to identify gaps in your knowledge base.
- Sync FAQs to Pinecone after making changes for immediate effect.`,
  },
  {
    kbName: 'Company Policies',
    title: 'Terms of Service Summary',
    sourceType: 'MANUAL' as const,
    content: `Terms of Service — Summary

Last updated: January 2026

1. Acceptance of Terms
By using our service, you agree to these terms. If you don't agree, please don't use the service.

2. Account Responsibilities
You are responsible for maintaining the security of your account credentials. Do not share your admin secret or API keys. You must be at least 18 years old or have parental consent to use the service.

3. Acceptable Use
You may not use the service to: generate harmful, illegal, or misleading content; attempt to bypass rate limits or security measures; reverse-engineer the platform; store personally identifiable information (PII) of minors; or use the service for spam, phishing, or fraud.

4. Data Ownership
You retain full ownership of your knowledge base content, FAQs, and documents. We do not claim any intellectual property rights over your data. We may use anonymized, aggregated usage data to improve our service.

5. Service Availability
We target 99.9% uptime for paid plans. Free tier availability is best-effort with no SLA. We reserve the right to modify or discontinue features with 30 days notice. Scheduled maintenance windows are announced 48 hours in advance.

6. Billing and Refunds
See our billing FAQ for detailed refund policy. All prices are in USD. Taxes may apply based on your jurisdiction. We use Stripe for secure payment processing.

7. Data Privacy
We comply with GDPR and CCPA. Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We do not sell your data to third parties. You can request full data export or deletion at any time.

8. Limitation of Liability
Our total liability is limited to the amount you paid in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages. AI-generated responses are provided "as-is" and should not be considered professional advice.

9. Termination
Either party may terminate with 30 days written notice. We may immediately terminate accounts that violate acceptable use policies. Upon termination, your data is deleted within 30 days unless legally required to retain.

10. Changes to Terms
We may update these terms with 30 days email notice. Continued use after changes constitutes acceptance. Material changes require explicit consent.

For the full legal terms, please visit our website or contact legal@example.com.`,
  },
  {
    kbName: 'Company Policies',
    title: 'Privacy Policy Summary',
    sourceType: 'MANUAL' as const,
    content: `Privacy Policy — Summary

Last updated: January 2026

What We Collect:
- Account information: email address, name, company name
- Usage data: conversation logs, analytics, feedback responses
- Technical data: IP address, browser type, device information
- Knowledge base content: FAQs, documents, and configurations you create

How We Use Your Data:
- To provide and improve the chatbot service
- To generate analytics and performance reports
- To send service-related notifications (billing, maintenance)
- To detect and prevent fraud or abuse

What We Don't Do:
- We never sell your personal data to third parties
- We don't use your knowledge base content to train our models
- We don't track you across other websites
- We don't store payment information (handled by Stripe)

Data Storage:
- All data is stored in encrypted PostgreSQL databases
- Vector embeddings are stored in Pinecone (US region)
- Files are processed in memory and not permanently stored on our servers
- Backups are encrypted and retained for 30 days

Your Rights (GDPR/CCPA):
- Right to access: Request a copy of all your data
- Right to delete: Request complete account and data deletion
- Right to portability: Export your data in standard formats
- Right to correction: Update or correct your personal information
- Right to object: Opt out of non-essential data processing

Data Retention:
- Active accounts: Data retained while account is active
- Deleted accounts: Data purged within 30 days
- Anonymized analytics: Retained indefinitely for service improvement
- Billing records: Retained for 7 years (legal requirement)

Contact:
For privacy-related inquiries: privacy@example.com
Data Protection Officer: dpo@example.com

We respond to all data requests within 30 days as required by GDPR.`,
  },
];

const CHATBOT_CONFIG = {
  id: 'default',
  isEnabled: true,
  welcomeMessage: 'Hello! 👋 I\'m your AI assistant. Ask me anything about our product, billing, or account. How can I help you today?',
  fallbackMessage: 'I\'m having trouble connecting right now. Please try again in a moment, or contact support@example.com for immediate assistance.',
  primaryModel: 'nvidia/nemotron-3-nano-30b-a3b:free',
  fallbackModel: 'arcee-ai/trinity-mini:free',
  temperature: 0.3,
  maxTokens: 1024,
  rateLimitPerMinute: 20,
  allowAnonymous: true,
  enableFeedback: true,
  customInstructions: 'You are a helpful, professional customer support assistant. Be concise but thorough. If you don\'t know the answer, say so honestly rather than guessing. Always maintain a friendly, supportive tone.',
};

const PROMPT_TEMPLATE = {
  name: 'default-system',
  version: 1,
  content: `You are an AI assistant for our platform. Your job is to help users by answering their questions accurately.

{{#if retrievedContext}}
Use the following knowledge base context to answer the user's question. Only use information from this context — do not make up information.

CONTEXT:
{{retrievedContext}}
{{else}}
No relevant knowledge base content was found. You may answer from general knowledge, but clearly indicate this by prefixing your response with "📚 *This answer is from my general knowledge, not our official documentation:*"
{{/if}}

{{#if customInstructions}}
ADDITIONAL INSTRUCTIONS:
{{customInstructions}}
{{/if}}

Rules:
- Be concise and helpful
- If the context contains the answer, quote or paraphrase it accurately
- Never invent product features or policies
- If unsure, suggest the user contact support`,
  variables: ['retrievedContext', 'customInstructions'],
};

const SAMPLE_CONVERSATIONS = [
  {
    title: 'Billing inquiry — payment methods',
    messages: [
      { role: 'USER' as const, content: 'What payment methods do you accept?' },
      { role: 'ASSISTANT' as const, content: 'We accept Visa, Mastercard, American Express, PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe with PCI DSS Level 1 compliance. Is there anything else about billing I can help with?', modelUsed: 'nvidia/nemotron-3-nano-30b-a3b:free', tokenCount: 52, latencyMs: 1850, isHelpful: true },
      { role: 'USER' as const, content: 'Do you have any discounts?' },
      { role: 'ASSISTANT' as const, content: 'Yes! Annual billing saves you 20% compared to monthly. For example, our Pro plan is $29/month billed monthly, or $23.20/month billed annually ($278.40/year). We also offer 50% discounts for education and non-profit organizations — just contact sales@example.com to apply.', modelUsed: 'nvidia/nemotron-3-nano-30b-a3b:free', tokenCount: 71, latencyMs: 2100, isHelpful: true },
    ],
  },
  {
    title: 'Feature question — chatbot customization',
    messages: [
      { role: 'USER' as const, content: 'Can I change the chatbot personality?' },
      { role: 'ASSISTANT' as const, content: 'Absolutely! Go to Admin → Settings → "Custom Instructions" to add personality directives. For example, you could write "Always respond in a formal, professional tone" or "Use casual, friendly language with emoji." You can also adjust the temperature setting — lower values (0.1-0.3) give more consistent responses, while higher values (0.7-1.0) make them more creative.', modelUsed: 'nvidia/nemotron-3-nano-30b-a3b:free', tokenCount: 85, latencyMs: 2450, isHelpful: true },
    ],
  },
  {
    title: 'Technical support — FAQ sync issue',
    messages: [
      { role: 'USER' as const, content: 'I added FAQs but they\'re not showing up in chat responses' },
      { role: 'ASSISTANT' as const, content: 'After adding FAQs, you need to sync them to the vector database. Here\'s what to check:\n\n1. Go to Admin → FAQ tab\n2. Check the embedding status badges — they should say "COMPLETED"\n3. If they say "PENDING", click the "Sync to Pinecone" button\n4. If they say "FAILED", verify your Pinecone and OpenRouter API keys are correct\n5. Try asking the exact question from your FAQ to test\n\nThe similarity threshold (default 0.72) might also be too strict — you can lower it in Settings.', modelUsed: 'nvidia/nemotron-3-nano-30b-a3b:free', tokenCount: 132, latencyMs: 3200, isHelpful: true },
      { role: 'USER' as const, content: 'That worked! The sync fixed it. Thanks!' },
      { role: 'ASSISTANT' as const, content: 'Great to hear! Remember to click "Sync to Pinecone" whenever you add or update FAQs. The sync process embeds your FAQ content into the vector database so the AI can find and use it in responses. Happy to help! 😊', modelUsed: 'nvidia/nemotron-3-nano-30b-a3b:free', tokenCount: 58, latencyMs: 1650, isHelpful: true },
    ],
  },
  {
    title: 'Account question — data security',
    messages: [
      { role: 'USER' as const, content: 'Is my data safe with you? We handle sensitive customer information.' },
      { role: 'ASSISTANT' as const, content: 'Absolutely, data security is our top priority. Here\'s what we do:\n\n• **Encryption at rest**: AES-256 for all stored data\n• **Encryption in transit**: TLS 1.3 for all communications\n• **Infrastructure**: SOC 2 Type II compliant\n• **API security**: Keys are hashed, rate limiting prevents abuse\n• **Data isolation**: Your knowledge base is fully isolated per account\n• **Compliance**: GDPR and CCPA compliant\n• **Regular testing**: Quarterly penetration tests\n\nYour knowledge base content is never used to train AI models. For a detailed overview, check our Privacy Policy or contact security@example.com.', modelUsed: 'nvidia/nemotron-3-nano-30b-a3b:free', tokenCount: 148, latencyMs: 3800, isHelpful: true },
    ],
  },
  {
    title: 'General inquiry — how RAG works',
    messages: [
      { role: 'USER' as const, content: 'How does your AI actually find relevant answers?' },
      { role: 'ASSISTANT' as const, content: '📚 *This answer is from my general knowledge:*\n\nOur chatbot uses a technique called Retrieval-Augmented Generation (RAG). Here\'s the simplified flow:\n\n1. **Your question gets embedded** — converted into a mathematical vector that captures its meaning\n2. **Vector search** — we search our database for the most semantically similar content from your knowledge base\n3. **Context injection** — the relevant content is injected into the AI\'s prompt as context\n4. **AI generates answer** — the model responds based on the actual context, not just its training data\n\nThis means the AI\'s answers are grounded in your real documentation, significantly reducing hallucinations. The system also shows a confidence score — if nothing relevant is found, it clearly labels the response as general knowledge.', modelUsed: 'nvidia/nemotron-3-nano-30b-a3b:free', tokenCount: 175, latencyMs: 4200, isHelpful: null },
    ],
  },
];

// ─── UNSEED ─────────────────────────────────────────────────

async function unseed() {
  console.log('🗑️  Removing all seed data...\n');

  // Delete in order (respect foreign keys)
  const messages = await prisma.chatMessage.deleteMany({});
  console.log(`   Deleted ${messages.count} messages`);

  const conversations = await prisma.chatConversation.deleteMany({});
  console.log(`   Deleted ${conversations.count} conversations`);

  const faqs = await prisma.faqContent.deleteMany({});
  console.log(`   Deleted ${faqs.count} FAQs`);

  const docs = await prisma.knowledgeDocument.deleteMany({});
  console.log(`   Deleted ${docs.count} documents`);

  const kbs = await prisma.knowledgeBase.deleteMany({});
  console.log(`   Deleted ${kbs.count} knowledge bases`);

  const config = await prisma.chatbotConfig.deleteMany({});
  console.log(`   Deleted ${config.count} config entries`);

  const templates = await prisma.promptTemplate.deleteMany({});
  console.log(`   Deleted ${templates.count} prompt templates`);

  console.log('\n✅ Database wiped clean.');
}

// ─── SEED ───────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Knowledge Bases
  console.log('📚 Creating knowledge bases...');
  const kbMap: Record<string, string> = {};
  for (const kb of KNOWLEDGE_BASES) {
    const created = await prisma.knowledgeBase.create({ data: kb });
    kbMap[kb.name] = created.id;
    console.log(`   ✓ ${kb.name} (${created.id})`);
  }

  // 2. FAQs (linked to first KB)
  console.log(`\n❓ Creating ${FAQS.length} FAQs...`);
  const defaultKbId = kbMap['Product Documentation'];
  for (const faq of FAQS) {
    await prisma.faqContent.create({
      data: {
        ...faq,
        knowledgeBaseId: defaultKbId,
        embeddingStatus: 'PENDING',
      },
    });
  }
  console.log(`   ✓ ${FAQS.length} FAQs created (status: PENDING — run "Sync to Pinecone" in admin)`);

  // 3. Documents
  console.log(`\n📄 Creating ${DOCUMENTS.length} documents...`);
  for (const doc of DOCUMENTS) {
    const kbId = kbMap[doc.kbName];
    const { createHash } = await import('crypto');
    const contentHash = createHash('sha256').update(doc.content).digest('hex');
    await prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: kbId,
        title: doc.title,
        sourceType: doc.sourceType,
        content: doc.content,
        contentHash,
        embeddingStatus: 'PENDING',
      },
    });
    console.log(`   ✓ ${doc.title} (${doc.content.length} chars)`);
  }

  // 4. Chatbot Config
  console.log('\n⚙️  Creating chatbot config...');
  await prisma.chatbotConfig.create({ data: CHATBOT_CONFIG });
  console.log('   ✓ Config created');

  // 5. Prompt Template
  console.log('\n📝 Creating prompt template...');
  await prisma.promptTemplate.create({ data: PROMPT_TEMPLATE });
  console.log('   ✓ Default system template created');

  // 6. Sample Conversations (for analytics demo)
  console.log(`\n💬 Creating ${SAMPLE_CONVERSATIONS.length} sample conversations...`);
  for (const conv of SAMPLE_CONVERSATIONS) {
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: 'demo-user',
        sessionId: randomUUID(),
        title: conv.title,
        source: 'web',
        isActive: false,
      },
    });

    for (const msg of conv.messages) {
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          userId: 'demo-user',
          role: msg.role,
          content: msg.content,
          modelUsed: 'modelUsed' in msg ? msg.modelUsed : undefined,
          tokenCount: 'tokenCount' in msg ? msg.tokenCount : undefined,
          latencyMs: 'latencyMs' in msg ? msg.latencyMs : undefined,
          isHelpful: 'isHelpful' in msg ? msg.isHelpful : undefined,
        },
      });
    }
    console.log(`   ✓ ${conv.title} (${conv.messages.length} messages)`);
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log('✅ Seed complete!\n');
  console.log('   📚 Knowledge Bases:  ' + KNOWLEDGE_BASES.length);
  console.log('   ❓ FAQs:             ' + FAQS.length);
  console.log('   📄 Documents:        ' + DOCUMENTS.length);
  console.log('   💬 Conversations:    ' + SAMPLE_CONVERSATIONS.length);
  console.log('   📊 Messages:         ' + SAMPLE_CONVERSATIONS.reduce((sum, c) => sum + c.messages.length, 0));
  console.log('   ⚙️  Config:           1');
  console.log('   📝 Prompt Templates: 1');
  console.log('\n⚠️  FAQs and documents are PENDING embedding.');
  console.log('   → Go to Admin Panel → FAQ tab → click "Sync to Pinecone"');
  console.log('   → Or run: npm run ingest:chatbot\n');
}

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  const command = process.argv[2] || 'seed';

  try {
    if (command === 'unseed') {
      await unseed();
    } else if (command === 'seed') {
      await unseed();
      await seed();
    } else {
      console.log('Usage: tsx scripts/seed.ts [seed|unseed]');
      console.log('  seed   — Wipe database + seed fresh data (default)');
      console.log('  unseed — Wipe all data only');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
