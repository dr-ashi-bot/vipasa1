import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

interface SessionRecord {
  session_id: string;
  user_id: string;
  focus_block_min: number;
  started_at: Date;
  expires_at: Date;
  visual_mode: 'puppy-walk' | 'gymnast-routine';
}

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, SessionRecord>();

  startSession(
    user_id: string,
    focusBlockMin = 15,
    thematicInterests: string[],
  ): {
    session_id: string;
    focus_block_min: number;
    started_at: string;
    expires_at: string;
    visual_mode: 'puppy-walk' | 'gymnast-routine';
    progress_ratio: number;
    is_expired: boolean;
  } {
    const immutableBlock = Math.max(15, Math.min(20, focusBlockMin));
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + immutableBlock * 60 * 1000,
    );
    const visualMode = thematicInterests.some((interest) =>
      interest.toLowerCase().includes('gym'),
    )
      ? 'gymnast-routine'
      : 'puppy-walk';

    const session: SessionRecord = {
      session_id: randomUUID(),
      user_id,
      focus_block_min: immutableBlock,
      started_at: startedAt,
      expires_at: expiresAt,
      visual_mode: visualMode,
    };

    this.sessions.set(user_id, session);
    return this.toVisualTimer(session);
  }

  getSession(user_id: string): SessionRecord | null {
    return this.sessions.get(user_id) ?? null;
  }

  canReceiveNewContent(user_id: string): boolean {
    const session = this.sessions.get(user_id);
    if (!session) {
      return false;
    }

    return session.expires_at.getTime() > Date.now();
  }

  getVisualTimer(user_id: string): {
    session_id: string;
    focus_block_min: number;
    started_at: string;
    expires_at: string;
    visual_mode: 'puppy-walk' | 'gymnast-routine';
    progress_ratio: number;
    is_expired: boolean;
  } | null {
    const session = this.sessions.get(user_id);
    if (!session) {
      return null;
    }

    return this.toVisualTimer(session);
  }

  private toVisualTimer(session: SessionRecord): {
    session_id: string;
    focus_block_min: number;
    started_at: string;
    expires_at: string;
    visual_mode: 'puppy-walk' | 'gymnast-routine';
    progress_ratio: number;
    is_expired: boolean;
  } {
    const totalMs =
      session.focus_block_min * 60 * 1000;
    const elapsedMs = Math.max(0, Date.now() - session.started_at.getTime());
    const progressRatio = Math.min(1, elapsedMs / totalMs);

    return {
      session_id: session.session_id,
      focus_block_min: session.focus_block_min,
      started_at: session.started_at.toISOString(),
      expires_at: session.expires_at.toISOString(),
      visual_mode: session.visual_mode,
      progress_ratio: progressRatio,
      is_expired: progressRatio >= 1,
    };
  }
}
