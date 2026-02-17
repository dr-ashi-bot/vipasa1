import { Injectable } from '@nestjs/common';

export interface MemoryEntry {
  id: string;
  user_id: string;
  type: 'conversation' | 'preference' | 'misconception' | 'error_sequence';
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  created_at: Date;
}

/**
 * Vector DB abstraction for LLM long-term memory.
 * Stores conversation history, preferences, misconceptions, error sequences.
 * Can be backed by Pinecone, Chroma, or in-memory for dev.
 */
@Injectable()
export class MemoryService {
  private readonly store: MemoryEntry[] = [];

  async add(entry: Omit<MemoryEntry, 'id' | 'created_at'>): Promise<MemoryEntry> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const full: MemoryEntry = {
      ...entry,
      id,
      created_at: new Date(),
    };
    this.store.push(full);
    return full;
  }

  async findByUser(userId: string, type?: MemoryEntry['type']): Promise<MemoryEntry[]> {
    return this.store
      .filter((e) => e.user_id === userId && (!type || e.type === type))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 20);
  }

  async findMisconceptions(userId: string, conceptId?: string): Promise<MemoryEntry[]> {
    return this.store
      .filter(
        (e) =>
          e.user_id === userId &&
          e.type === 'misconception' &&
          (!conceptId || e.metadata?.concept_id === conceptId),
      )
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 5);
  }

  async findErrorSequences(userId: string, conceptId?: string): Promise<MemoryEntry[]> {
    return this.store
      .filter(
        (e) =>
          e.user_id === userId &&
          e.type === 'error_sequence' &&
          (!conceptId || e.metadata?.concept_id === conceptId),
      )
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 3);
  }

  async getContextForGeneration(
    userId: string,
    conceptId: string,
  ): Promise<string> {
    const misconceptions = await this.findMisconceptions(userId, conceptId);
    const errors = await this.findErrorSequences(userId, conceptId);
    const prefs = await this.findByUser(userId, 'preference');

    const parts: string[] = [];
    if (misconceptions.length) {
      parts.push(
        'Past misconceptions to avoid reinforcing:',
        misconceptions.map((m) => `- ${m.content}`).join('\n'),
      );
    }
    if (errors.length) {
      parts.push(
        'Error patterns (actions that led to mistakes):',
        errors.map((e) => `- ${e.content}`).join('\n'),
      );
    }
    if (prefs.length) {
      parts.push(
        'User preferences:',
        prefs.map((p) => `- ${p.content}`).join('\n'),
      );
    }
    return parts.join('\n\n');
  }
}
