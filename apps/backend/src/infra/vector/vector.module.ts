import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from '../../ai/ai.module';
import { VectorMemoryService } from './vector-memory.service';

@Module({
  imports: [ConfigModule, AiModule],
  providers: [VectorMemoryService],
  exports: [VectorMemoryService],
})
export class VectorModule {}

