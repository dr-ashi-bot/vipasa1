import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RabbitMqPublisher } from './rabbitmq.publisher';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [RabbitMqPublisher],
  exports: [RabbitMqPublisher],
})
export class EventsModule {}
