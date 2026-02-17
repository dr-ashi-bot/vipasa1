import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({ default: 'Ashi' })
  first_name: string;

  @Column('simple-array', { default: 'gymnastics,cute puppies' })
  thematic_interests: string;

  @Column({ default: 6 })
  math_level: number;

  @Column({ default: 4 })
  ela_level: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
