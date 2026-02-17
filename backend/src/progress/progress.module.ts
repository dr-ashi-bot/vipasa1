import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { BktModule } from '../bkt/bkt.module';
import { MemoryModule } from '../memory/memory.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [BktModule, MemoryModule, EventsModule],
  controllers: [ProgressController],
})
export class ProgressModule {}
