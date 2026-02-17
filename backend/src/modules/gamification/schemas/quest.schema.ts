import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'quests', timestamps: true })
export class Quest extends Document {
  @Prop({ required: true, unique: true })
  quest_id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  target_count: number;

  @Prop()
  time_limit_minutes: number;

  @Prop({ required: true })
  xp_reward: number;

  @Prop({ default: false })
  is_monthly: boolean;

  @Prop({ type: Date })
  expires_at: Date;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);

@Schema({ collection: 'user_quests', timestamps: true })
export class UserQuest extends Document {
  @Prop({ required: true, index: true })
  user_id: string;

  @Prop({ required: true, index: true })
  quest_id: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: Date, default: Date.now })
  started_at: Date;
}

export const UserQuestSchema = SchemaFactory.createForClass(UserQuest);
