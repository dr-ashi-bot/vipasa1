import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum League {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  SAPPHIRE = 'Sapphire',
  RUBY = 'Ruby',
  EMERALD = 'Emerald',
  AMETHYST = 'Amethyst',
  PEARL = 'Pearl',
  OBSIDIAN = 'Obsidian',
  DIAMOND = 'Diamond',
}

@Schema({ timestamps: true, collection: 'gamification_states' })
export class GamificationState extends Document {
  @Prop({ required: true, unique: true })
  user_id: string;

  @Prop({ default: 0 })
  current_streak: number;

  @Prop({ default: 0 })
  streak_freezes: number;

  @Prop({ default: 0 })
  total_xp: number;

  @Prop({ default: 0 })
  weekly_xp: number;

  @Prop({ type: String, enum: League, default: League.BRONZE })
  current_league: League;

  @Prop({ default: null })
  last_activity_date: Date;

  @Prop({ default: 0 })
  consecutive_correct: number;

  @Prop({ default: 0 })
  daily_quests_completed: number;

  @Prop({ default: 0 })
  monthly_quests_completed: number;

  @Prop({ type: [Object], default: [] })
  active_quests: Array<{
    quest_id: string;
    title: string;
    target: number;
    progress: number;
    expires_at: Date;
    type: 'daily' | 'monthly';
  }>;
}

export const GamificationStateSchema =
  SchemaFactory.createForClass(GamificationState);
