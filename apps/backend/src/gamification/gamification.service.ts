import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { leagueForTotalXp, LeagueTier, LEAGUE_TIERS } from '../domain/leagues';
import { GamificationState } from '../db/mongo/gamification-state.schema';
import { XpEvent } from '../db/mongo/xp-event.schema';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(`${aIso}T00:00:00.000Z`).getTime();
  const b = new Date(`${bIso}T00:00:00.000Z`).getTime();
  return Math.round((b - a) / (24 * 3600 * 1000));
}

function weekId(d: Date): string {
  // ISO-ish week id for cohorting (simple).
  const year = d.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const day = Math.floor((d.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
  const week = Math.ceil(day / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function stableHashToInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(GamificationState.name)
    private readonly stateModel: Model<GamificationState>,
    @InjectModel(XpEvent.name)
    private readonly xpEventModel: Model<XpEvent>,
  ) {}

  async getOrCreateState(user_id: string) {
    const existing = await this.stateModel.findOne({ user_id }).lean<GamificationState>().exec();
    if (existing) return existing;
    const created = await this.stateModel.create({ user_id });
    return created.toObject();
  }

  async applyXpEvent(input: {
    user_id: string;
    event_type: 'progress.submitted' | 'video.verified';
    xp_delta: number;
    occurred_at: string;
    is_correct?: boolean;
    response_time_ms?: number | null;
    payload?: Record<string, unknown>;
  }): Promise<GamificationState> {
    const occurredAt = new Date(input.occurred_at);
    const today = isoDate(occurredAt);

    const state = await this.stateModel.findOne({ user_id: input.user_id }).exec();
    const doc = state ?? new this.stateModel({ user_id: input.user_id });

    // Ledger (high-throughput friendly collection)
    await this.xpEventModel.create({
      user_id: input.user_id,
      event_type: input.event_type,
      xp_delta: input.xp_delta,
      payload: input.payload ?? {},
    });

    // Streak updates (only when earning something or submitting progress)
    const last = doc.last_active_date;
    if (!last) {
      doc.current_streak = 1;
    } else if (last === today) {
      // same day, keep streak
    } else {
      const gap = daysBetween(last, today);
      if (gap === 1) {
        doc.current_streak += 1;
      } else if (gap > 1) {
        if (doc.streak_freezes > 0) {
          doc.streak_freezes -= 1;
          // Keep streak (freeze prevents loss), but do not “double count” days.
        } else {
          doc.current_streak = 1;
        }
      }
    }
    doc.last_active_date = today;

    // XP + league
    doc.total_xp += input.xp_delta;
    doc.current_league = leagueForTotalXp(doc.total_xp) as LeagueTier;

    // Flow-state signal for fading confetti (5 correct quickly)
    if (input.event_type === 'progress.submitted' && input.is_correct) {
      const ts = new Date(input.occurred_at);
      const recent = [...(doc.recent_correct_timestamps ?? []), ts]
        .sort((a, b) => a.getTime() - b.getTime())
        .slice(-5);
      doc.recent_correct_timestamps = recent;

      if (recent.length >= 5) {
        const windowSec = (recent[recent.length - 1].getTime() - recent[0].getTime()) / 1000;
        doc.flow_state_level = windowSec <= 180 ? 1 : 0;
      } else {
        doc.flow_state_level = 0;
      }
    }

    await doc.save();
    return doc.toObject();
  }

  async purchaseStreakFreeze(user_id: string, costXp = 200) {
    const state = await this.stateModel.findOne({ user_id }).exec();
    const doc = state ?? new this.stateModel({ user_id });
    if (doc.total_xp < costXp) {
      return { ok: false, reason: 'not_enough_xp', costXp, total_xp: doc.total_xp };
    }
    doc.total_xp -= costXp;
    doc.streak_freezes += 1;
    doc.current_league = leagueForTotalXp(doc.total_xp) as LeagueTier;
    await doc.save();
    return { ok: true, costXp, total_xp: doc.total_xp, streak_freezes: doc.streak_freezes };
  }

  getWeeklyLeaderboardCohort(user_id: string, totalXp: number, now = new Date()) {
    const wid = weekId(now);
    const cohortSeed = stableHashToInt(`${wid}:${user_id}`) % 1000;
    const entries: Array<{ user_id: string; display_name: string; xp: number; league: LeagueTier }> =
      [];

    // Create 29 deterministic “peers” for the cohort.
    for (let i = 0; i < 29; i++) {
      const peerId = `peer_${cohortSeed}_${i}`;
      const xp = Math.max(0, Math.round((stableHashToInt(peerId + wid) % 6000) + 200));
      entries.push({
        user_id: peerId,
        display_name: `Learner ${i + 1}`,
        xp,
        league: leagueForTotalXp(xp),
      });
    }

    entries.push({
      user_id,
      display_name: 'Ashi',
      xp: totalXp,
      league: leagueForTotalXp(totalXp),
    });

    const sorted = entries.sort((a, b) => b.xp - a.xp).slice(0, 30);

    const userRank = sorted.findIndex((e) => e.user_id === user_id) + 1;
    const tier = leagueForTotalXp(totalXp);
    const promotionCount = tier === 'Diamond' ? 0 : 10; // MVP rule
    const demotionCount = tier === 'Bronze' ? 0 : 5;

    return {
      week_id: wid,
      tier,
      tiers: LEAGUE_TIERS,
      user_rank: userRank,
      promotion_zone: promotionCount ? { start_rank: 1, end_rank: promotionCount } : null,
      demotion_zone: demotionCount
        ? { start_rank: 30 - demotionCount + 1, end_rank: 30 }
        : null,
      entries: sorted.map((e, idx) => ({ rank: idx + 1, ...e })),
    };
  }

  getActiveQuests(now = new Date()) {
    const month = now.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    return {
      daily: {
        title: 'Quick Sprint',
        description: 'Solve 5 problems in 3 minutes',
        target: 5,
        time_limit_sec: 180,
      },
      monthly: {
        title: `${month} Quest`,
        description: `Earn XP all month long to help Ashi’s story grow.`,
      },
    };
  }
}

