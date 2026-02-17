import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { connect, type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import type { ProgressEventPayload, VideoEventPayload } from "../types";
import { GamificationService } from "./gamification.service";

type QueueEvent =
  | { event_type: "progress.submitted"; payload: ProgressEventPayload }
  | { event_type: "video.verified"; payload: VideoEventPayload };

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private queueName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly gamificationService: GamificationService,
  ) {
    this.queueName = this.configService.get<string>("RABBITMQ_QUEUE", "gamification.progress");
  }

  async onModuleInit(): Promise<void> {
    const rabbitUrl = this.configService.get<string>("RABBITMQ_URL", "amqp://guest:guest@localhost:5672");
    try {
      const connection = await connect(rabbitUrl);
      const channel = await connection.createChannel();
      await channel.assertQueue(this.queueName, { durable: true });
      await channel.consume(this.queueName, (msg) => this.consume(msg), { noAck: false });
      this.connection = connection;
      this.channel = channel;
      this.logger.log(`RabbitMQ connected, consuming queue "${this.queueName}"`);
    } catch (error) {
      this.logger.warn(
        `RabbitMQ unavailable; falling back to in-process updates. ${(error as Error).message}`,
      );
      this.channel = null;
      this.connection = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publishProgress(payload: ProgressEventPayload): Promise<void> {
    await this.publishOrFallback({ event_type: "progress.submitted", payload });
  }

  async publishVideo(payload: VideoEventPayload): Promise<void> {
    await this.publishOrFallback({ event_type: "video.verified", payload });
  }

  private async publishOrFallback(event: QueueEvent): Promise<void> {
    if (!this.channel) {
      await this.handleEvent(event);
      return;
    }

    this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(event)), {
      persistent: true,
    });
  }

  private async consume(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    try {
      const event = JSON.parse(msg.content.toString()) as QueueEvent;
      await this.handleEvent(event);
      this.channel.ack(msg);
    } catch (error) {
      this.logger.error(`Failed to process queue event: ${(error as Error).message}`);
      this.channel.nack(msg, false, false);
    }
  }

  private async handleEvent(event: QueueEvent): Promise<void> {
    if (event.event_type === "progress.submitted") {
      await this.gamificationService.applyProgressEvent(event.payload);
      return;
    }
    await this.gamificationService.applyVideoEvent(event.payload);
  }
}
