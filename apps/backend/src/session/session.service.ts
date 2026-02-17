import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningSessionEntity } from '../db/postgres/learning-session.entity';
import { UserService } from '../user/user.service';
import { BktService } from '../bkt/bkt.service';
import { CurriculumService } from '../curriculum/curriculum.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(LearningSessionEntity)
    private readonly sessionRepo: Repository<LearningSessionEntity>,
    private readonly userService: UserService,
    private readonly bkt: BktService,
    private readonly curriculum: CurriculumService,
  ) {}

  async startSession(input: {
    user_id: string;
    duration_sec: number;
    preferred_track: 'math' | 'ela';
  }): Promise<{
    session: LearningSessionEntity;
    next: { track: 'math' | 'ela'; concept_id: string };
  }> {
    const user = await this.userService.getOrCreateUser(input.user_id);
    const ends_at = new Date(Date.now() + input.duration_sec * 1000);
    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        user_id: user.user_id,
        duration_sec: input.duration_sec,
        ends_at,
        is_active: true,
      }),
    );

    const track = input.preferred_track;
    const candidates = this.curriculum.candidateConceptsForTrack(user, track);
    const masteries = await this.bkt.getMasteries(user.user_id, candidates);
    const pByConcept = new Map(masteries.map((m) => [m.concept_id, m.probability_known]));
    const concept_id =
      candidates
        .map((c) => ({ concept_id: c, p: pByConcept.get(c) ?? 0.2 }))
        .sort((a, b) => a.p - b.p)[0]?.concept_id ?? candidates[0];

    return { session, next: { track, concept_id } };
  }

  async getSession(session_id: string): Promise<LearningSessionEntity> {
    const session = await this.sessionRepo.findOne({ where: { session_id } });
    if (!session) throw new NotFoundException('session not found');
    return session;
  }

  isExpired(session: LearningSessionEntity): boolean {
    return session.ends_at.getTime() <= Date.now() || !session.is_active;
  }
}

