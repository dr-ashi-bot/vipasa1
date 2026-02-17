import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from './database/postgres.module';
import { MongoDatabaseModule } from './database/mongo.module';
import { MessagingModule } from './messaging/rabbitmq.module';
import { VectorModule } from './vector/vector.module';

@Module({
  imports: [PostgresDatabaseModule, MongoDatabaseModule, MessagingModule, VectorModule],
  exports: [PostgresDatabaseModule, MongoDatabaseModule, MessagingModule, VectorModule],
})
export class InfraModule {}

