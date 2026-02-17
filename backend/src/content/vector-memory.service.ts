import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Vector Memory Service
 *
 * Implements the RAG (Retrieval-Augmented Generation) pipeline's
 * long-term memory using a Vector Database (Pinecone or ChromaDB).
 *
 * Stores:
 * - Conversation history per user
 * - User preferences and interests
 * - Specific sequences of actions that led to past errors
 * - Misconception patterns for Socratic follow-up
 */
@Injectable()
export class VectorMemoryService {
  private readonly logger = new Logger(VectorMemoryService.name);
  private pineconeIndex: unknown = null;
  private chromaCollection: unknown = null;
  private initialized = false;

  /** In-memory fallback when vector DB is not available */
  private memoryStore: Map<string, Array<{
    concept_id: string;
    content: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }>> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeVectorDB().catch((err) => {
      this.logger.warn(`Vector DB initialization deferred: ${err.message}`);
    });
  }

  /**
   * Initialize connection to Pinecone or ChromaDB.
   */
  private async initializeVectorDB(): Promise<void> {
    const pineconeKey = this.configService.get<string>('PINECONE_API_KEY');
    const pineconeIndex = this.configService.get<string>('PINECONE_INDEX');

    // Try Pinecone first
    if (pineconeKey && pineconeKey !== 'placeholder') {
      try {
        const { Pinecone } = await import('@pinecone-database/pinecone');
        const pc = new Pinecone({ apiKey: pineconeKey });
        this.pineconeIndex = pc.index(pineconeIndex ?? 'adaptive-learning-memory');
        this.initialized = true;
        this.logger.log('Connected to Pinecone vector database');
        return;
      } catch (err) {
        this.logger.warn(`Pinecone init failed: ${err}`);
      }
    }

    // Try ChromaDB as fallback
    try {
      const chroma = await import('chromadb');
      const client = new chroma.ChromaClient();
      this.chromaCollection = await client.getOrCreateCollection({
        name: 'adaptive_learning_memory',
      });
      this.initialized = true;
      this.logger.log('Connected to ChromaDB vector database');
      return;
    } catch (err) {
      this.logger.warn(`ChromaDB init failed: ${err}`);
    }

    this.logger.warn(
      'No vector database available, using in-memory fallback',
    );
  }

  /**
   * Store a learning interaction in the vector database.
   * This builds the long-term memory for RAG retrieval.
   */
  async storeInteraction(
    userId: string,
    interaction: {
      concept_id: string;
      prompt: string;
      response: Record<string, unknown>;
      timestamp: string;
      session_id?: string;
    },
  ): Promise<void> {
    const content = JSON.stringify({
      concept: interaction.concept_id,
      response_summary: interaction.response,
    });

    if (this.pineconeIndex) {
      try {
        const index = this.pineconeIndex as {
          upsert: (vectors: unknown[]) => Promise<void>;
        };
        await index.upsert([
          {
            id: `${userId}_${interaction.concept_id}_${Date.now()}`,
            values: this.simpleTextToVector(content),
            metadata: {
              user_id: userId,
              concept_id: interaction.concept_id,
              timestamp: interaction.timestamp,
              session_id: interaction.session_id,
            },
          },
        ]);
        return;
      } catch (err) {
        this.logger.warn(`Pinecone upsert failed: ${err}`);
      }
    }

    // In-memory fallback
    const key = `${userId}`;
    if (!this.memoryStore.has(key)) {
      this.memoryStore.set(key, []);
    }
    this.memoryStore.get(key)!.push({
      concept_id: interaction.concept_id,
      content,
      timestamp: interaction.timestamp,
      metadata: {
        session_id: interaction.session_id,
      },
    });

    // Keep only last 100 interactions per user
    const entries = this.memoryStore.get(key)!;
    if (entries.length > 100) {
      this.memoryStore.set(key, entries.slice(-100));
    }
  }

  /**
   * Store a mistake/misconception for Socratic follow-up.
   */
  async storeMistake(
    userId: string,
    conceptId: string,
    incorrectAnswer: string,
    errorAnalysis: string,
  ): Promise<void> {
    await this.storeInteraction(userId, {
      concept_id: conceptId,
      prompt: 'mistake_record',
      response: {
        type: 'mistake',
        incorrect_answer: incorrectAnswer,
        error_analysis: errorAnalysis,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Retrieve past mistakes for a specific concept (RAG retrieval).
   * Used by the Socratic tutor to ask targeted guiding questions.
   */
  async retrievePastMistakes(
    userId: string,
    conceptId: string,
  ): Promise<string[]> {
    if (this.pineconeIndex) {
      try {
        const index = this.pineconeIndex as {
          query: (params: unknown) => Promise<{
            matches: Array<{ metadata: Record<string, string> }>;
          }>;
        };
        const queryResult = await index.query({
          vector: this.simpleTextToVector(`mistake ${conceptId}`),
          topK: 5,
          filter: {
            user_id: userId,
            concept_id: conceptId,
          },
          includeMetadata: true,
        });

        return queryResult.matches.map(
          (match) => match.metadata?.['error_analysis'] ?? 'Unknown error pattern',
        );
      } catch (err) {
        this.logger.warn(`Pinecone query failed: ${err}`);
      }
    }

    // In-memory fallback
    const entries = this.memoryStore.get(userId) ?? [];
    return entries
      .filter((e) => e.concept_id === conceptId)
      .slice(-5)
      .map((e) => {
        try {
          const parsed = JSON.parse(e.content);
          return parsed?.response_summary?.error_analysis ?? 'Past attempt recorded';
        } catch {
          return 'Past attempt recorded';
        }
      });
  }

  /**
   * Retrieve user's conversation history for context injection.
   */
  async retrieveConversationHistory(
    userId: string,
    limit = 10,
  ): Promise<string[]> {
    const entries = this.memoryStore.get(userId) ?? [];
    return entries.slice(-limit).map((e) => e.content);
  }

  /**
   * Simple text-to-vector function (placeholder for a real embedding model).
   * In production, use OpenAI's text-embedding-ada-002 or similar.
   */
  private simpleTextToVector(text: string): number[] {
    const vector = new Array(1536).fill(0);
    for (let i = 0; i < text.length && i < 1536; i++) {
      vector[i] = text.charCodeAt(i) / 255.0;
    }
    return vector;
  }
}
