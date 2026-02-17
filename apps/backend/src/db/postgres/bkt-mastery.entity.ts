import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'bkt_mastery' })
@Index(['user_id', 'concept_id'], { unique: true })
export class BktMasteryEntity {
  @PrimaryGeneratedColumn('uuid')
  mastery_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'text' })
  concept_id!: string;

  @Column({ type: 'float', default: 0.2 })
  probability_known!: number;
}
