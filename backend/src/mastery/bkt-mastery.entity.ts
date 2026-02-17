import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { SubjectTrack } from '../domain/enums/subject-track.enum';

@Index('idx_mastery_user_subject_concept', ['user_id', 'subject', 'concept_id'], {
  unique: true,
})
@Entity('bkt_mastery')
export class BktMastery {
  @PrimaryGeneratedColumn('uuid')
  mastery_id!: string;

  @Column('uuid')
  user_id!: string;

  @Column({ type: 'varchar' })
  concept_id!: string;

  @Column({ type: 'enum', enum: SubjectTrack })
  subject!: SubjectTrack;

  @Column({ type: 'float', default: 0.25 })
  probability_known!: number;

  @Column({ type: 'int', default: 0 })
  opportunities!: number;

  @Column({ type: 'boolean', nullable: true })
  last_response_correct!: boolean | null;
}
