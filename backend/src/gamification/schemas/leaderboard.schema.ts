import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { League } from '../../common/enums/league.enum';

export type LeaderboardDocument = Leaderboard & Document;

@Schema({ timestamps: true, collection: 'leaderboards' })
export class Leaderboard {
  @Prop({ required: true, index: true })
  cohort_id: string;

  @Prop({ type: String, enum: League, required: true })
  league: League;

  @Prop({ required: true })
  week_start: Date;

  @Prop({ required: true })
  week_end: Date;

  @Prop({
    type: [
      {
        user_id: String,
        display_name: String,
        weekly_xp: Number,
        rank: Number,
        zone: String,
      },
    ],
    default: [],
  })
  entries: {
    user_id: string;
    display_name: string;
    weekly_xp: number;
    rank: number;
    zone: 'promotion' | 'safe' | 'demotion';
  }[];

  @Prop({ default: false })
  finalized: boolean;
}

export const LeaderboardSchema = SchemaFactory.createForClass(Leaderboard);
