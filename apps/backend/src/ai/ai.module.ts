import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiTutorService } from './ai-tutor.service';
import { DeterministicEmbeddingsService } from './deterministic-embeddings.service';
import { OpenAiEmbeddingsService } from './openai-embeddings.service';
import { EmbeddingsService } from '../infra/vector/vector-memory.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OpenAI,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('OPENAI_API_KEY');
        return new OpenAI({ apiKey: apiKey || 'missing' });
      },
    },
    {
      provide: 'EMBEDDINGS_SERVICE',
      inject: [ConfigService, OpenAI],
      useFactory: (config: ConfigService, openai: OpenAI): EmbeddingsService => {
        const apiKey = config.get<string>('OPENAI_API_KEY');
        if (apiKey) return new OpenAiEmbeddingsService(config, openai);
        return new DeterministicEmbeddingsService();
      },
    },
    {
      provide: AiTutorService,
      inject: [ConfigService, OpenAI],
      useFactory: (config: ConfigService, openai: OpenAI) =>
        new AiTutorService(config, openai),
    },
  ],
  exports: [AiTutorService, 'EMBEDDINGS_SERVICE', OpenAI],
})
export class AiModule {}

