import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import amqplib, { Channel, ChannelModel } from 'amqplib';
import { ProgressSubmittedEvent } from './gamification-event.types';

@Injectable()
export class GamificationEventsPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(GamificationEventsPublisher.name);
  private readonly brokerUrl = process.env.RABBITMQ_URL ?? '';
  private readonly queueName =
    process.env.RABBITMQ_PROGRESS_QUEUE ?? 'adaptive.progress.submitted';
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  async publishProgressSubmitted(event: ProgressSubmittedEvent): Promise<boolean> {
    if (!this.brokerUrl) {
      return false;
    }

    try {
      await this.ensureChannel();
      if (!this.channel) {
        return false;
      }
      await this.channel.assertQueue(this.queueName, { durable: true });
      this.channel.sendToQueue(
        this.queueName,
        Buffer.from(JSON.stringify(event)),
        { persistent: true },
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `Failed to publish RabbitMQ progress event. ${(error as Error).message}`,
      );
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      this.logger.warn('Unable to close RabbitMQ cleanly.');
    }
  }

  private async ensureChannel(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    const model = await amqplib.connect(this.brokerUrl);
    this.connection = model;
    this.channel = await model.createChannel();
  }
}
