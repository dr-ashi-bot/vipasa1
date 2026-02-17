import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LEAGUE_TIERS, LeagueTier } from '../../domain/leagues';

export type GamificationStateDocument = HydratedDocument<GamificationState>;

@Schema({ collection: 'gamification_state', timestamps: true })
export class GamificationState {
  @Prop({ type: String, required: true, index: true, unique: true })
  user_id!: string;

  @Prop({ type: Number, default: 0 })
  current_streak!: number;

  @Prop({ type: Number, default: 0 })
  streak_freezes!: number;

  @Prop({ type: Number, default: 0 })
  total_xp!: number;

  @Prop({ type: String, enum: LEAGUE_TIERS, default: 'Bronze' })
  current_league!: LeagueTier;

  // ISO date string (YYYY-MM-DD) for streak logic.
  @Prop({ type: String, default: null })
  last_active_date!: string | null;

  // Used for flow-state “fade extrinsic rewards”.
  @Prop({ type: [Date], default: [] })
  recent_correct_timestamps!: Date[];

  @Prop({ type: Number, default: 0 })
  flow_state_level!: number;
}

export const GamificationStateSchema =
  SchemaFactory.createForClass(GamificationState);
