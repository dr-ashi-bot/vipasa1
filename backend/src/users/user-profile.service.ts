import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserProfile } from './user-profile.entity';

@Injectable()
export class UserProfileService {
  private readonly profiles = new Map<string, UserProfile>();

  getOrCreateProfile(userId?: string): UserProfile {
    const resolvedId = userId ?? randomUUID();
    const existing = this.profiles.get(resolvedId);

    if (existing) {
      return existing;
    }

    const created: UserProfile = {
      user_id: resolvedId,
      first_name: 'Ashi',
      thematic_interests: ['gymnastics', 'cute puppies'],
      math_level: 6,
      ela_level: 4,
    };

    this.profiles.set(created.user_id, created);
    return created;
  }

  getProfileOrThrow(userId: string): UserProfile {
    return this.getOrCreateProfile(userId);
  }
}
