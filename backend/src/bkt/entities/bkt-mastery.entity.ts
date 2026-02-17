import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserProfile } from '../../user/entities/user-profile.entity';

@Entity('bkt_mastery')
@Index(['user_id', 'concept_id'], { unique: true })
export class BKTMastery {
  @PrimaryGeneratedColumn('uuid')
  mastery_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => UserProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserProfile;

  /**
   * Concept identifier following the pattern: {track}_{grade}_{topic}
   * Examples: math_6_geometry, math_6_integers, ela_4_reading_comprehension
   */
  @Column({ type: 'varchar', length: 255 })
  concept_id: string;

  /** Track: 'math' or 'ela' - enables dual-track decoupling */
  @Column({ type: 'varchar', length: 10 })
  track: 'math' | 'ela';

  /** P(L₀): Prior probability of knowing the concept (0.0 - 1.0) */
  @Column({ type: 'float', default: 0.1 })
  probability_known: number;

  /** P(T): Probability of transitioning from unknown to known per opportunity */
  @Column({ type: 'float', default: 0.2 })
  probability_transit: number;

  /** P(S): Probability of a correct answer despite not knowing (lucky guess) */
  @Column({ type: 'float', default: 0.15 })
  probability_slip: number;

  /** P(G): Probability of an incorrect answer despite knowing (careless error) */
  @Column({ type: 'float', default: 0.1 })
  probability_guess: number;

  /** Total practice attempts on this concept */
  @Column({ type: 'int', default: 0 })
  total_attempts: number;

  /** Total correct answers on this concept */
  @Column({ type: 'int', default: 0 })
  correct_attempts: number;

  /** Mastery threshold: concept is considered "mastered" above this */
  @Column({ type: 'float', default: 0.95 })
  mastery_threshold: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
