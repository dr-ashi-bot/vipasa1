import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

export enum ConceptDomain {
  MATH = 'math',
  ELA = 'ela',
}

@Entity('concepts')
export class ConceptEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  concept_id: string;

  @Column({
    type: 'enum',
    enum: ConceptDomain,
    default: ConceptDomain.MATH,
  })
  domain: ConceptDomain;

  @Column({ type: 'int' })
  grade_level: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  prerequisites: string[];

  @CreateDateColumn()
  created_at: Date;
}
