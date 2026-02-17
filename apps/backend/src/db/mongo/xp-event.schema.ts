import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type XpEventDocument = HydratedDocument<XpEvent>;

@Schema({ collection: 'xp_events', timestamps: true })
export class XpEvent {
  @Prop({ type: String, required: true, index: true })
  user_id!: string;

  @Prop({ type: String, required: true })
  event_type!: 'progress.submitted' | 'video.verified';

  @Prop({ type: Number, required: true })
  xp_delta!: number;

  @Prop({ type: Object, default: {} })
  payload!: Record<string, unknown>;
}

export const XpEventSchema = SchemaFactory.createForClass(XpEvent);
