import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Vector Store Service
 *
 * Provides long-term memory for the AI tutor via embeddings.
 * Stores conversation history, user preferences, misconceptions,
 * and the specific sequence of actions that led to past errors.
 *
 * In production, this would use Pinecone or Chroma.
 * This implementation provides a local in-memory vector store
 * for development with the same interface.
 */
export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    user_id: string;
    type: 'conversation' | 'misconception' | 'preference' | 'error_sequence';
    concept_id?: string;
    timestamp: string;
    [key: string]: any;
  };
  embedding?: number[];
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private documents: VectorDocument[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log(
      'Vector store initialized (in-memory mode for development)',
    );
  }

  /**
   * Store a document with metadata for later retrieval.
   */
  async upsert(doc: VectorDocument): Promise<void> {
    const existingIdx = this.documents.findIndex((d) => d.id === doc.id);
    if (existingIdx >= 0) {
      this.documents[existingIdx] = doc;
    } else {
      this.documents.push(doc);
    }
    this.logger.debug(`Upserted document ${doc.id} for user ${doc.metadata.user_id}`);
  }

  /**
   * Store a user's misconception for later Socratic questioning.
   */
  async storeMisconception(
    userId: string,
    conceptId: string,
    question: string,
    userAnswer: string,
    correctAnswer: string,
    errorAnalysis: string,
  ): Promise<void> {
    const doc: VectorDocument = {
      id: `misconception_${userId}_${conceptId}_${Date.now()}`,
      content: `Concept: ${conceptId}\nQuestion: ${question}\nUser answered: ${userAnswer}\nCorrect answer: ${correctAnswer}\nError analysis: ${errorAnalysis}`,
      metadata: {
        user_id: userId,
        type: 'misconception',
        concept_id: conceptId,
        timestamp: new Date().toISOString(),
      },
    };
    await this.upsert(doc);
  }

  /**
   * Store a conversation exchange for context continuity.
   */
  async storeConversation(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    conceptId?: string,
  ): Promise<void> {
    const doc: VectorDocument = {
      id: `conv_${userId}_${Date.now()}`,
      content: `[${role}]: ${content}`,
      metadata: {
        user_id: userId,
        type: 'conversation',
        concept_id: conceptId,
        timestamp: new Date().toISOString(),
      },
    };
    await this.upsert(doc);
  }

  /**
   * Retrieve relevant context for a user and concept.
   * Uses simple keyword matching in development; would use
   * cosine similarity on embeddings in production.
   */
  async queryRelevantContext(
    userId: string,
    conceptId: string,
    limit = 5,
  ): Promise<VectorDocument[]> {
    const userDocs = this.documents.filter(
      (d) => d.metadata.user_id === userId,
    );

    const scored = userDocs.map((doc) => {
      let score = 0;
      if (doc.metadata.concept_id === conceptId) score += 10;
      if (doc.metadata.type === 'misconception') score += 5;
      if (doc.metadata.type === 'error_sequence') score += 3;

      const recency =
        Date.now() - new Date(doc.metadata.timestamp).getTime();
      score -= recency / (1000 * 60 * 60 * 24);
      return { doc, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.doc);
  }

  /**
   * Get all misconceptions for a user on a specific concept.
   */
  async getMisconceptions(
    userId: string,
    conceptId: string,
  ): Promise<VectorDocument[]> {
    return this.documents.filter(
      (d) =>
        d.metadata.user_id === userId &&
        d.metadata.type === 'misconception' &&
        d.metadata.concept_id === conceptId,
    );
  }
}
