import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { LEAGUE_TIERS, type LeagueTier } from "../types";

export type GamificationStateDocument = HydratedDocument<GamificationState>;

@Schema({ collection: "gamification_states", timestamps: true })
export class GamificationState {
  @Prop({ required: true, unique: true })
  user_id!: string;

  @Prop({ default: 0 })
  current_streak!: number;

  @Prop({ default: 0 })
  streak_freezes!: number;

  @Prop({ default: 0 })
  total_xp!: number;

  @Prop({ enum: LEAGUE_TIERS, default: "Bronze" })
  current_league!: LeagueTier;

  @Prop({ default: 0 })
  weekly_xp!: number;

  @Prop({ default: 30 })
  weekly_rank!: number;

  @Prop({ type: String, default: "" })
  last_active_on!: string;

  @Prop({ default: 0 })
  quick_correct_streak!: number;

  @Prop({ default: 1 })
  confetti_opacity!: number;

  @Prop({ default: 1 })
  confetti_frequency!: number;
}

export const GamificationStateSchema = SchemaFactory.createForClass(GamificationState);
