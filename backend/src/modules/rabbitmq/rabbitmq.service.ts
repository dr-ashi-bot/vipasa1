import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface GamificationEvent {
  type: 'correct_answer' | 'video_completed' | 'quest_progress';
  user_id: string;
  xp_awarded?: number;
  data?: any;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly QUEUE_NAME = 'gamification_events';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const url = this.configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
      console.log('✅ RabbitMQ connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error.message);
    }
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  async publishGamificationEvent(event: GamificationEvent): Promise<void> {
    if (!this.channel) {
      console.warn('RabbitMQ channel not available, skipping event publication');
      return;
    }

    try {
      const message = JSON.stringify(event);
      this.channel.sendToQueue(this.QUEUE_NAME, Buffer.from(message), {
        persistent: true,
      });
      console.log('📤 Published gamification event:', event.type);
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }

  async consumeGamificationEvents(callback: (event: GamificationEvent) => Promise<void>) {
    if (!this.channel) {
      console.warn('RabbitMQ channel not available');
      return;
    }

    await this.channel.consume(
      this.QUEUE_NAME,
      async (msg) => {
        if (msg) {
          try {
            const event: GamificationEvent = JSON.parse(msg.content.toString());
            await callback(event);
            this.channel.ack(msg);
          } catch (error) {
            console.error('Error processing gamification event:', error);
            this.channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false },
    );
  }
}
