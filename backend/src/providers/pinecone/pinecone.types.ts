/**
 * Pinecone provider types
 */

export interface PineconeVectorMetadata {
  sourceType: 'faq' | 'document';
  sourceId: string;
  knowledgeBaseId: string;
  category?: string;
  title?: string;
  chunkIndex?: number;
  totalChunks?: number;
  text: string;
  createdAt: string;
}

export interface PineconeQueryResult {
  id: string;
  score: number;
  metadata: PineconeVectorMetadata;
}
