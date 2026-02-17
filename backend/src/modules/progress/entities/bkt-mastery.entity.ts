import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('bkt_mastery')
@Index(['user_id', 'concept_id'], { unique: true })
export class BKTMasteryEntity {
  @PrimaryGeneratedColumn('uuid')
  mastery_id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  concept_id: string;

  @Column({ type: 'float', default: 0.3 })
  probability_known: number;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_attempted: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
