import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { AIService } from './ai.service';
import { ContentController } from './content.controller';
import { UserModule } from '../user/user.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [UserModule, ProgressModule],
  controllers: [ContentController],
  providers: [ContentService, AIService],
  exports: [ContentService],
})
export class ContentModule {}
