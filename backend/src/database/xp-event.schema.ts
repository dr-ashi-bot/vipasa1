import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum XpEventType {
  CORRECT_ANSWER = 'correct_answer',
  STREAK_BONUS = 'streak_bonus',
  VIDEO_COMPLETION = 'video_completion',
  QUEST_COMPLETION = 'quest_completion',
  LEAGUE_PROMOTION = 'league_promotion',
}

@Schema({ timestamps: true, collection: 'xp_events' })
export class XpEvent extends Document {
  @Prop({ required: true })
  user_id: string;

  @Prop({ type: String, enum: XpEventType, required: true })
  event_type: XpEventType;

  @Prop({ required: true })
  xp_amount: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const XpEventSchema = SchemaFactory.createForClass(XpEvent);
