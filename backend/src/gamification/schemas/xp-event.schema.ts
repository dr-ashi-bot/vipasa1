import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type XPEventDocument = XPEvent & Document;

@Schema({ timestamps: true, collection: 'xp_events' })
export class XPEvent {
  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true })
  event_type: string;

  @Prop({ required: true })
  xp_amount: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop()
  concept_id: string;

  @Prop()
  session_id: string;
}

export const XPEventSchema = SchemaFactory.createForClass(XPEvent);
