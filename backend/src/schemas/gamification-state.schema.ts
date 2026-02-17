import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GamificationStateDocument = GamificationState & Document;

export enum LeagueTier {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Sapphire = 'Sapphire',
  Ruby = 'Ruby',
  Emerald = 'Emerald',
  Amethyst = 'Amethyst',
  Pearl = 'Pearl',
  Obsidian = 'Obsidian',
  Diamond = 'Diamond',
}

@Schema({ collection: 'gamification_states' })
export class GamificationState {
  @Prop({ required: true, unique: true })
  user_id: string;

  @Prop({ default: 0 })
  current_streak: number;

  @Prop({ default: 0 })
  streak_freezes: number;

  @Prop({ default: 0 })
  total_xp: number;

  @Prop({ enum: LeagueTier, default: LeagueTier.Bronze })
  current_league: LeagueTier;

  @Prop({ default: Date.now })
  last_activity_date: Date;

  @Prop({ default: 0 })
  weekly_xp: number;

  @Prop({ default: Date.now })
  week_start: Date;
}

export const GamificationStateSchema =
  SchemaFactory.createForClass(GamificationState);
