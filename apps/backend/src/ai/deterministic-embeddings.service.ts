import type { EmbeddingsService } from '../infra/vector/vector-memory.service';

export class DeterministicEmbeddingsService implements EmbeddingsService {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedOne(t));
  }

  private embedOne(text: string): number[] {
    const dims = 256;
    const v = new Array<number>(dims).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      v[code % dims] += 1;
    }
    // L2 normalize
    let norm = 0;
    for (const x of v) norm += x * x;
    norm = Math.sqrt(norm) || 1;
    return v.map((x) => x / norm);
  }
}

