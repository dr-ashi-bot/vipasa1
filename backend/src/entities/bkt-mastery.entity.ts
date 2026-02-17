import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bkt_mastery')
export class BKTMastery {
  @PrimaryGeneratedColumn('uuid')
  mastery_id: string;

  @Column('uuid')
  user_id: string;

  @Column({ length: 100 })
  concept_id: string;

  @Column('float', { default: 0.0 })
  probability_known: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
