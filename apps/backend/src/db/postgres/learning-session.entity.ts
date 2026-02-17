import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'learning_session' })
export class LearningSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  session_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  started_at!: Date;

  @Column({ type: 'timestamptz' })
  ends_at!: Date;

  @Column({ type: 'int' })
  duration_sec!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;
}
