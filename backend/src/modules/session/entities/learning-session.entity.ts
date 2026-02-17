import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export interface SessionConfig {
  session_duration_minutes: number;
  visual_timer_type: 'puppy' | 'gymnast';
  enable_flow_state_detection: boolean;
}

@Entity('learning_sessions')
export class LearningSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  session_id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @CreateDateColumn()
  started_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'jsonb' })
  config: SessionConfig;

  @Column({ type: 'int', default: 0 })
  questions_completed: number;

  @Column({ type: 'boolean', default: false })
  flow_state_achieved: boolean;

  @Column({ type: 'int', default: 0 })
  correct_streak: number;
}
