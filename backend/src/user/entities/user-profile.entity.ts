import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 100, default: 'Ashi' })
  first_name: string;

  @Column('simple-array', { default: 'gymnastics,cute puppies' })
  thematic_interests: string[];

  @Column({ type: 'int', default: 6 })
  math_level: number;

  @Column({ type: 'int', default: 4 })
  ela_level: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar_url: string;

  @Column({ type: 'int', default: 0 })
  total_sessions_completed: number;

  @Column({ type: 'float', default: 0 })
  average_session_duration_min: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
