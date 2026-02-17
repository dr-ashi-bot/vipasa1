import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import type { SessionState } from "../types";

@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, SessionState>();

  constructor(private readonly configService: ConfigService) {}

  startSession(
    user_id: string,
    preferredTheme?: "puppy-walk" | "gymnast-routine",
  ): SessionState {
    const configuredDuration = this.configService.get<number>("SESSION_DURATION_MINUTES", 18);
    const duration_minutes = Math.min(20, Math.max(15, configuredDuration));

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + duration_minutes * 60_000);
    const session: SessionState = {
      session_id: randomUUID(),
      user_id,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      duration_minutes,
      visual_theme: preferredTheme ?? "puppy-walk",
    };

    this.sessions.set(session.session_id, session);
    return session;
  }

  assertActive(sessionId: string): SessionState {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new ForbiddenException(
        "This focus block is unavailable. Start a fresh session to continue.",
      );
    }

    const now = Date.now();
    if (now >= new Date(session.expires_at).getTime()) {
      throw new ForbiddenException(
        "Session ended to protect focus stamina. Come back tomorrow to unlock the next story step.",
      );
    }

    return session;
  }
}
