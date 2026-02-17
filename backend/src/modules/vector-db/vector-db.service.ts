import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';

export interface UserMemory {
  id: string;
  user_id: string;
  content: string;
  memory_type: 'conversation' | 'misconception' | 'preference' | 'achievement';
  metadata?: Record<string, any>;
  created_at: Date;
}

@Injectable()
export class VectorDbService implements OnModuleInit {
  private pinecone: Pinecone;
  private indexName: string;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.indexName = this.configService.get('PINECONE_INDEX_NAME', 'adaptive-learning-memory');
  }

  async onModuleInit() {
    const apiKey = this.configService.get('PINECONE_API_KEY');

    if (!apiKey) {
      console.warn('⚠️  Pinecone API key not configured, vector DB features will be disabled');
      return;
    }

    try {
      this.pinecone = new Pinecone({
        apiKey,
      });
      this.isInitialized = true;
      console.log('✅ Pinecone initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone:', error.message);
    }
  }

  async storeMemory(memory: UserMemory, embedding: number[]): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Vector DB not initialized, skipping memory storage');
      return;
    }

    try {
      const index = this.pinecone.Index(this.indexName);
      await index.upsert([
        {
          id: memory.id,
          values: embedding,
          metadata: {
            user_id: memory.user_id,
            content: memory.content,
            memory_type: memory.memory_type,
            created_at: memory.created_at.toISOString(),
            ...memory.metadata,
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to store memory:', error);
    }
  }

  async queryMemories(
    user_id: string,
    queryEmbedding: number[],
    topK: number = 5,
  ): Promise<UserMemory[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const index = this.pinecone.Index(this.indexName);
      const queryResponse = await index.query({
        vector: queryEmbedding,
        filter: { user_id: { $eq: user_id } },
        topK,
        includeMetadata: true,
      });

      return queryResponse.matches.map((match) => ({
        id: match.id,
        user_id: match.metadata.user_id as string,
        content: match.metadata.content as string,
        memory_type: match.metadata.memory_type as any,
        metadata: match.metadata,
        created_at: new Date(match.metadata.created_at as string),
      }));
    } catch (error) {
      console.error('Failed to query memories:', error);
      return [];
    }
  }

  async deleteUserMemories(user_id: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const index = this.pinecone.Index(this.indexName);
      await index.deleteMany({
        filter: { user_id: { $eq: user_id } },
      });
    } catch (error) {
      console.error('Failed to delete memories:', error);
    }
  }
}
