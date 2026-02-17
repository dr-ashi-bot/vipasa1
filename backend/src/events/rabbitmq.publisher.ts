import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

const QUEUE = 'gamification.events';

@Injectable()
export class RabbitMqPublisher implements OnModuleInit, OnModuleDestroy {
  private channel: amqp.Channel | null = null;
  private readonly enabled: boolean;

  constructor() {
    this.enabled = !!process.env.RABBITMQ_URL;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) return;
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL!);
      const ch = await conn.createChannel();
      await ch.assertQueue(QUEUE, { durable: true });
      this.channel = ch;
    } catch {
      // RabbitMQ optional; in-process events still work
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
  }

  async publish(event: { type: string; payload: unknown }) {
    if (!this.channel) return;
    try {
      this.channel.sendToQueue(
        QUEUE,
        Buffer.from(JSON.stringify(event)),
        { persistent: true },
      );
    } catch {
      // Ignore
    }
  }
}
