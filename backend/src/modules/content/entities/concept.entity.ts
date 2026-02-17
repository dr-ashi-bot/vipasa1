import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

export enum ConceptDomain {
  MATH = 'math',
  ELA = 'ela',
}

@Entity('concepts')
export class ConceptEntity {
  @PrimaryColumn()
  concept_id: string;

  @Column({
    type: 'enum',
    enum: ConceptDomain,
  })
  domain: ConceptDomain;

  @Column('int')
  grade_level: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('text', { array: true, nullable: true })
  prerequisites: string[];

  @CreateDateColumn()
  created_at: Date;
}
