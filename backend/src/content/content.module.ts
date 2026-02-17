import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { VectorMemoryService } from './vector-memory.service';
import { UserModule } from '../user/user.module';
import { BKTModule } from '../bkt/bkt.module';

@Module({
  imports: [ConfigModule, UserModule, BKTModule],
  controllers: [ContentController],
  providers: [ContentService, VectorMemoryService],
  exports: [ContentService, VectorMemoryService],
})
export class ContentModule {}
