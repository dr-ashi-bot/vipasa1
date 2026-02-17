import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserProfileEntity } from '../../user/entities/user-profile.entity';

export interface SessionConfig {
  session_duration_minutes: number;
  visual_timer_type: 'puppy' | 'gymnast';
  enable_flow_state_detection: boolean;
}

@Entity('learning_sessions')
export class LearningSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  session_id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => UserProfileEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserProfileEntity;

  @CreateDateColumn()
  started_at: Date;

  @Column()
  expires_at: Date;

  @Column('jsonb')
  config: SessionConfig;

  @Column('int', { default: 0 })
  questions_completed: number;

  @Column({ default: false })
  flow_state_achieved: boolean;

  @Column({ default: true })
  is_active: boolean;
}
