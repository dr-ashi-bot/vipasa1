import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { EmbeddingsService } from '../infra/vector/vector-memory.service';

export class OpenAiEmbeddingsService implements EmbeddingsService {
  constructor(
    private readonly config: ConfigService,
    private readonly openai: OpenAI,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const model = this.config.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
    const resp = await this.openai.embeddings.create({
      model,
      input: texts,
    });
    return resp.data.map((d) => d.embedding as number[]);
  }
}

