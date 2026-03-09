export {
  getPineconeClient,
  getChatbotIndex,
  getGlobalNamespace,
  upsertVectors,
  queryVectors,
  deleteVectors,
  deleteAllVectors,
} from './pinecone.client';

export type { PineconeVectorMetadata, PineconeQueryResult } from './pinecone.types';
