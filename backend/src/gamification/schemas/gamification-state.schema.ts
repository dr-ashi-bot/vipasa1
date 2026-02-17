import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { League } from '../../common/enums/league.enum';

export type GamificationStateDocument = GamificationState & Document;

@Schema({ timestamps: true, collection: 'gamification_states' })
export class GamificationState {
  @Prop({ required: true, unique: true, index: true })
  user_id: string;

  @Prop({ default: 0 })
  current_streak: number;

  @Prop({ default: 0 })
  longest_streak: number;

  @Prop({ default: 1 })
  streak_freezes: number;

  @Prop({ default: 0 })
  total_xp: number;

  @Prop({ default: 0 })
  weekly_xp: number;

  @Prop({ type: String, enum: League, default: League.BRONZE })
  current_league: League;

  @Prop({ default: null })
  cohort_id: string;

  @Prop({ default: null })
  last_activity_date: Date;

  @Prop({ default: 0 })
  consecutive_correct: number;

  @Prop({ default: 1.0 })
  confetti_opacity: number;

  @Prop({ default: 1.0 })
  confetti_frequency: number;

  /** Daily quest progress */
  @Prop({ type: Object, default: {} })
  daily_quests: Record<string, { target: number; current: number; completed: boolean }>;

  /** Monthly quest progress */
  @Prop({ type: Object, default: {} })
  monthly_quest: {
    title: string;
    target: number;
    current: number;
    completed: boolean;
  };
}

export const GamificationStateSchema =
  SchemaFactory.createForClass(GamificationState);
