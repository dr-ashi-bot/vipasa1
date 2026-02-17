import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LeagueTier } from '../domain/enums/league-tier.enum';

@Schema({
  collection: 'gamification_states',
  timestamps: true,
})
export class GamificationState {
  @Prop({ required: true, unique: true, index: true })
  user_id!: string;

  @Prop({ default: 0 })
  current_streak!: number;

  @Prop({ default: 0 })
  streak_freezes!: number;

  @Prop({ default: 0 })
  total_xp!: number;

  @Prop({ enum: Object.values(LeagueTier), default: LeagueTier.BRONZE })
  current_league!: LeagueTier;

  @Prop({ default: 0 })
  weekly_xp!: number;

  @Prop({ default: 0 })
  fast_correct_streak!: number;

  @Prop({ type: Date, default: null })
  last_active_at!: Date | null;
}

export type GamificationStateDocument = HydratedDocument<GamificationState>;
export const GamificationStateSchema =
  SchemaFactory.createForClass(GamificationState);
