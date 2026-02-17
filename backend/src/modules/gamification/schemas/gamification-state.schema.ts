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

@Schema({ collection: 'gamification_states', timestamps: true })
export class GamificationState extends Document {
  @Prop({ required: true, unique: true, index: true })
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

  @Prop({ type: Date })
  last_activity_date: Date;

  @Prop({ type: Date })
  week_start_date: Date;
}

export const GamificationStateSchema = SchemaFactory.createForClass(GamificationState);
