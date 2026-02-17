import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { VectorStoreService } from './vector-store.service';
import { BktModule } from '../bkt/bkt.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [BktModule, UserModule],
  controllers: [ContentController],
  providers: [ContentService, VectorStoreService],
  exports: [ContentService, VectorStoreService],
})
export class ContentModule {}
