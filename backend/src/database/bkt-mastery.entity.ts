import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';

export enum SubjectTrack {
  MATH = 'math',
  ELA = 'ela',
}

@Entity('bkt_mastery')
export class BktMastery {
  @PrimaryGeneratedColumn('uuid')
  mastery_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => UserProfile, (user) => user.masteries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserProfile;

  @Column({ type: 'varchar', length: 200 })
  concept_id: string;

  @Column({
    type: 'enum',
    enum: SubjectTrack,
  })
  subject_track: SubjectTrack;

  @Column({ type: 'float', default: 0.1 })
  probability_known: number;

  @Column({ type: 'float', default: 0.3 })
  probability_learn: number;

  @Column({ type: 'float', default: 0.1 })
  probability_guess: number;

  @Column({ type: 'float', default: 0.1 })
  probability_slip: number;

  @Column({ type: 'int', default: 0 })
  total_attempts: number;

  @Column({ type: 'int', default: 0 })
  correct_attempts: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
