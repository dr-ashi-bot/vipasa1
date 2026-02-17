import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'RABBITMQ_URI',
          'amqp://vipasa:vipasa@localhost:5672',
        ),
        exchanges: [
          {
            name: config.get<string>('RABBITMQ_EXCHANGE', 'vipasa.events'),
            type: 'topic',
          },
        ],
        connectionInitOptions: { wait: true, timeout: 5000 },
      }),
    }),
  ],
  exports: [RabbitMQModule],
})
export class MessagingModule {}
