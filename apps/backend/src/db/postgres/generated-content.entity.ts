import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ContentTrack = 'math' | 'ela';

@Entity({ name: 'generated_content' })
export class GeneratedContentEntity {
  @PrimaryGeneratedColumn('uuid')
  content_id!: string;

  @Column({ type: 'uuid' })
  session_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'text' })
  concept_id!: string;

  @Column({ type: 'text' })
  track!: ContentTrack;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'text' })
  question_text!: string;

  @Column({ type: 'text' })
  expected_answer!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
