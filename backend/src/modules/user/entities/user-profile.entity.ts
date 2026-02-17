import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 100, default: 'Ashi' })
  first_name: string;

  @Column({ type: 'simple-array', default: 'gymnastics,cute puppies' })
  thematic_interests: string[];

  @Column({ type: 'int', default: 6 })
  math_level: number;

  @Column({ type: 'int', default: 4 })
  ela_level: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
