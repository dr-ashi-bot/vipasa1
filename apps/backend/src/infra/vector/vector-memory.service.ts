import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ChromaClient } from 'chromadb';

export interface MemoryRecord {
  id: string;
  user_id: string;
  text: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EmbeddingsService {
  embed(texts: string[]): Promise<number[][]>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

@Injectable()
export class VectorMemoryService {
  private readonly logger = new Logger(VectorMemoryService.name);
  private chroma:
    | {
        client: ChromaClient;
        collectionName: string;
      }
    | null = null;

  private inMemory: Array<{
    record: MemoryRecord;
    embedding: number[];
  }> = [];

  constructor(
    private readonly config: ConfigService,
    @Inject('EMBEDDINGS_SERVICE') private readonly embeddings: EmbeddingsService,
  ) {
    const url = this.config.get<string>('CHROMA_URL');
    const collectionName = this.config.get<string>(
      'CHROMA_COLLECTION',
      'user_memory',
    );
    if (url) {
      try {
        this.chroma = { client: new ChromaClient({ path: url }), collectionName };
        this.logger.log(`Vector memory: Chroma enabled (${url}/${collectionName})`);
      } catch (err) {
        this.logger.warn(`Vector memory: falling back to in-memory (${String(err)})`);
        this.chroma = null;
      }
    } else {
      this.logger.log('Vector memory: in-memory (CHROMA_URL not set)');
    }
  }

  async addMemory(input: Omit<MemoryRecord, 'id' | 'created_at'>): Promise<string> {
    const id = randomUUID();
    const record: MemoryRecord = {
      ...input,
      id,
      created_at: new Date().toISOString(),
    };
    const [embedding] = await this.embeddings.embed([record.text]);

    if (!this.chroma) {
      this.inMemory.push({ record, embedding });
      return id;
    }

    try {
      const collection = await this.chroma.client.getOrCreateCollection({
        name: this.chroma.collectionName,
      });
      await collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [record.text],
        metadatas: [{ ...record.metadata, user_id: record.user_id }],
      });
      return id;
    } catch (err) {
      this.logger.warn(`Chroma add failed; storing in-memory (${String(err)})`);
      this.inMemory.push({ record, embedding });
      return id;
    }
  }

  async queryMemories(params: {
    user_id: string;
    query: string;
    limit?: number;
  }): Promise<MemoryRecord[]> {
    const limit = params.limit ?? 5;
    const [queryEmbedding] = await this.embeddings.embed([params.query]);

    if (!this.chroma) {
      return this.inMemory
        .filter((x) => x.record.user_id === params.user_id)
        .map((x) => ({ record: x.record, score: cosineSimilarity(queryEmbedding, x.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.record);
    }

    try {
      const collection = await this.chroma.client.getOrCreateCollection({
        name: this.chroma.collectionName,
      });
      const result = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: { user_id: params.user_id },
      });

      const docs = result.documents?.[0] ?? [];
      const metas = result.metadatas?.[0] ?? [];
      const ids = result.ids?.[0] ?? [];

      return docs.map((text, i) => ({
        id: ids[i] ?? randomUUID(),
        user_id: params.user_id,
        text: text ?? '',
        metadata: (metas?.[i] as Record<string, unknown>) ?? {},
        created_at: new Date().toISOString(),
      }));
    } catch (err) {
      this.logger.warn(`Chroma query failed; using in-memory (${String(err)})`);
      return this.inMemory
        .filter((x) => x.record.user_id === params.user_id)
        .map((x) => ({ record: x.record, score: cosineSimilarity(queryEmbedding, x.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.record);
    }
  }
}

