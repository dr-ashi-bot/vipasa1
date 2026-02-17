import { Injectable } from '@nestjs/common';
import { BktService } from '../bkt/bkt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';

export const SESSION_DURATION_MINUTES = 18;

@Injectable()
export class SessionService {
  constructor(
    private bktService: BktService,
    @InjectRepository(UserProfile)
    private userRepo: Repository<UserProfile>,
  ) {}

  async startSession(userId: string): Promise<{
    sessionId: string;
    durationMinutes: number;
    mathConcepts: string[];
    elaConcepts: string[];
    expiresAt: Date;
  }> {
    await this.ensureUserProfile(userId);
    const path = await this.bktService.getOptimalLearningPath(userId);
    const duration = SESSION_DURATION_MINUTES;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    return {
      sessionId,
      durationMinutes: duration,
      mathConcepts: path.mathConcepts,
      elaConcepts: path.elaConcepts,
      expiresAt,
    };
  }

  isSessionExpired(expiresAt: Date): boolean {
    return new Date() >= expiresAt;
  }

  private async ensureUserProfile(userId: string): Promise<void> {
    const existing = await this.userRepo.findOne({ where: { user_id: userId } });
    if (!existing) {
      const profile = this.userRepo.create({
        user_id: userId,
        first_name: 'Ashi',
        thematic_interests: 'gymnastics,cute puppies',
        math_level: 6,
        ela_level: 4,
      });
      await this.userRepo.save(profile);
    }
  }
}
