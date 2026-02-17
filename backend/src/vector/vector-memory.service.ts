import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

type MemoryMetadataValue = string | number | boolean;
type MemoryMetadata = Record<string, MemoryMetadataValue>;

export interface MemoryRecord {
  id: string;
  user_id: string;
  text: string;
  metadata: MemoryMetadata;
  created_at: string;
}

interface ChromaCollectionResponse {
  id: string;
  name: string;
}

interface ChromaQueryResponse {
  ids?: string[][];
  documents?: string[][];
  metadatas?: Array<Array<Record<string, unknown>>>;
}

@Injectable()
export class VectorMemoryService {
  private readonly logger = new Logger(VectorMemoryService.name);
  private readonly fallbackMemory = new Map<string, MemoryRecord[]>();
  private readonly chromaUrl = process.env.CHROMA_URL ?? '';
  private readonly chromaCollectionName =
    process.env.CHROMA_COLLECTION ?? 'adaptive-learning-memory';
  private chromaCollectionId: string | null = null;

  async storeMemory(input: {
    user_id: string;
    text: string;
    metadata: MemoryMetadata;
  }): Promise<MemoryRecord> {
    const record: MemoryRecord = {
      id: randomUUID(),
      user_id: input.user_id,
      text: input.text,
      metadata: input.metadata,
      created_at: new Date().toISOString(),
    };

    const existing = this.fallbackMemory.get(record.user_id) ?? [];
    this.fallbackMemory.set(record.user_id, [record, ...existing].slice(0, 400));
    await this.pushToChroma(record);

    return record;
  }

  async queryMemories(
    user_id: string,
    query: string,
    limit = 5,
  ): Promise<MemoryRecord[]> {
    const chromaResults = await this.queryChroma(user_id, query, limit);
    if (chromaResults.length > 0) {
      return chromaResults;
    }

    const memory = this.fallbackMemory.get(user_id) ?? [];
    return memory
      .map((item) => ({
        item,
        score: this.overlapScore(query, item.text),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((row) => row.item);
  }

  private async ensureChromaCollection(): Promise<string | null> {
    if (!this.chromaUrl) {
      return null;
    }

    if (this.chromaCollectionId) {
      return this.chromaCollectionId;
    }

    try {
      const createResponse = await fetch(`${this.chromaUrl}/api/v1/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.chromaCollectionName }),
      });

      if (createResponse.ok) {
        const payload =
          (await createResponse.json()) as ChromaCollectionResponse;
        this.chromaCollectionId = payload.id;
        return payload.id;
      }

      const getResponse = await fetch(
        `${this.chromaUrl}/api/v1/collections/${this.chromaCollectionName}`,
      );
      if (!getResponse.ok) {
        return null;
      }

      const payload = (await getResponse.json()) as ChromaCollectionResponse;
      this.chromaCollectionId = payload.id;
      return payload.id;
    } catch (error) {
      this.logger.warn(
        `Chroma collection unavailable. Using fallback memory. ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async pushToChroma(record: MemoryRecord): Promise<void> {
    const collectionId = await this.ensureChromaCollection();
    if (!collectionId) {
      return;
    }

    try {
      await fetch(`${this.chromaUrl}/api/v1/collections/${collectionId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [record.id],
          documents: [record.text],
          metadatas: [
            {
              ...record.metadata,
              user_id: record.user_id,
              created_at: record.created_at,
            },
          ],
        }),
      });
    } catch (error) {
      this.logger.warn(
        `Unable to write memory to Chroma. ${(error as Error).message}`,
      );
    }
  }

  private async queryChroma(
    user_id: string,
    query: string,
    limit: number,
  ): Promise<MemoryRecord[]> {
    const collectionId = await this.ensureChromaCollection();
    if (!collectionId) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.chromaUrl}/api/v1/collections/${collectionId}/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query_texts: [query],
            n_results: limit,
            where: { user_id },
          }),
        },
      );

      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as ChromaQueryResponse;
      const ids = payload.ids?.[0] ?? [];
      const documents = payload.documents?.[0] ?? [];
      const metadatas = payload.metadatas?.[0] ?? [];

      return ids.map((id, index) => {
        const meta = this.normalizeMetadata(metadatas[index] ?? {});
        return {
          id,
          user_id,
          text: documents[index] ?? '',
          metadata: meta,
          created_at: String(meta.created_at ?? new Date().toISOString()),
        };
      });
    } catch (error) {
      this.logger.warn(
        `Unable to query Chroma memory. ${(error as Error).message}`,
      );
      return [];
    }
  }

  private normalizeMetadata(raw: Record<string, unknown>): MemoryMetadata {
    const normalized: MemoryMetadata = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        normalized[key] = value;
      }
    });
    return normalized;
  }

  private overlapScore(query: string, text: string): number {
    const queryTokens = new Set(
      query
        .toLowerCase()
        .split(/\W+/)
        .filter((token) => token.length > 2),
    );
    const textTokens = new Set(
      text
        .toLowerCase()
        .split(/\W+/)
        .filter((token) => token.length > 2),
    );

    if (queryTokens.size === 0 || textTokens.size === 0) {
      return 0;
    }

    let overlap = 0;
    queryTokens.forEach((token) => {
      if (textTokens.has(token)) {
        overlap += 1;
      }
    });

    return overlap / queryTokens.size;
  }
}
