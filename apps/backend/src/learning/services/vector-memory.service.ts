import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";

interface MemoryRecord {
  id: string;
  user_id: string;
  text: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  created_at: string;
}

@Injectable()
export class VectorMemoryService implements OnModuleInit {
  private readonly logger = new Logger(VectorMemoryService.name);
  private readonly chromaUrl: string;
  private readonly collectionName: string;
  private readonly openAIClient: OpenAI | null;
  private collectionId: string | null = null;
  private readonly memoryRecords: MemoryRecord[] = [];

  constructor(private readonly configService: ConfigService) {
    this.chromaUrl = this.configService.get<string>("CHROMA_URL", "http://localhost:8000");
    this.collectionName = this.configService.get<string>("CHROMA_COLLECTION", "ashi-memory");
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    this.openAIClient = apiKey && apiKey !== "replace_me" ? new OpenAI({ apiKey }) : null;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureCollection();
  }

  async storeMemory(
    userId: string,
    text: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const embedding = await this.embed(text);
    const record: MemoryRecord = {
      id: randomUUID(),
      user_id: userId,
      text,
      metadata,
      embedding,
      created_at: new Date().toISOString(),
    };
    this.memoryRecords.unshift(record);

    if (!this.collectionId) {
      return;
    }

    await this.safeChromaCall(`/api/v1/collections/${this.collectionId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: [record.id],
        documents: [record.text],
        metadatas: [{ ...record.metadata, user_id: record.user_id, created_at: record.created_at }],
        embeddings: [record.embedding],
      }),
    });
  }

  async findRelevantMemories(userId: string, query: string, limit = 4): Promise<string[]> {
    const queryEmbedding = await this.embed(query);

    const local = this.memoryRecords
      .filter((record) => record.user_id === userId)
      .map((record) => ({
        text: record.text,
        score: this.cosineSimilarity(queryEmbedding, record.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.text);

    if (this.collectionId) {
      const response = await this.safeChromaCall(`/api/v1/collections/${this.collectionId}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_embeddings: [queryEmbedding],
          n_results: limit,
          where: { user_id: userId },
        }),
      });

      if (response?.ok) {
        const payload = (await response.json()) as { documents?: string[][] };
        const remote = payload.documents?.[0] ?? [];
        if (remote.length > 0) {
          return remote;
        }
      }
    }

    return local;
  }

  async findRecentMisconceptions(userId: string, conceptId: string, limit = 3): Promise<string[]> {
    return this.memoryRecords
      .filter(
        (record) =>
          record.user_id === userId &&
          record.metadata.kind === "misconception" &&
          record.metadata.concept_id === conceptId,
      )
      .slice(0, limit)
      .map((record) => record.text);
  }

  private async embed(text: string): Promise<number[]> {
    if (this.openAIClient) {
      const response = await this.openAIClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0]?.embedding ?? this.fallbackEmbedding(text);
    }

    return this.fallbackEmbedding(text);
  }

  private fallbackEmbedding(text: string): number[] {
    const vector = new Array<number>(48).fill(0);
    for (let i = 0; i < text.length; i += 1) {
      const bucket = i % vector.length;
      vector[bucket] += text.charCodeAt(i) / 255;
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0)) || 1;
    return vector.map((value) => value / norm);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }
    return dot / denominator;
  }

  private async ensureCollection(): Promise<void> {
    const created = await this.safeChromaCall("/api/v1/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: this.collectionName }),
    });

    if (created?.ok) {
      const payload = (await created.json()) as { id?: string };
      this.collectionId = payload.id ?? null;
      return;
    }

    const existing = await this.safeChromaCall(
      `/api/v1/collections/${encodeURIComponent(this.collectionName)}`,
      { method: "GET" },
    );
    if (existing?.ok) {
      const payload = (await existing.json()) as { id?: string };
      this.collectionId = payload.id ?? null;
    }
  }

  private async safeChromaCall(
    path: string,
    init: RequestInit,
  ): Promise<Response | null> {
    try {
      return await fetch(`${this.chromaUrl}${path}`, init);
    } catch (error) {
      this.logger.warn(`Chroma unavailable, using in-memory fallback: ${(error as Error).message}`);
      return null;
    }
  }
}
