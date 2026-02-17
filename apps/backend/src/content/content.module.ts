import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { GeneratedContentEntity } from '../db/postgres/generated-content.entity';
import { VectorModule } from '../infra/vector/vector.module';
import { SessionModule } from '../session/session.module';
import { UserModule } from '../user/user.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedContentEntity]),
    AiModule,
    VectorModule,
    SessionModule,
    UserModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

