import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { UserProfile } from '../entities/user-profile.entity';
import { MemoryModule } from '../memory/memory.module';
import { BktModule } from '../bkt/bkt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile]),
    MemoryModule,
    BktModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
