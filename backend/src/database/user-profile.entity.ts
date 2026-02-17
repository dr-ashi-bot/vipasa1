import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BktMastery } from './bkt-mastery.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 100, default: 'Ashi' })
  first_name: string;

  @Column('simple-array', { default: 'gymnastics,cute puppies' })
  thematic_interests: string[];

  @Column({ type: 'int', default: 6 })
  math_level: number;

  @Column({ type: 'int', default: 4 })
  ela_level: number;

  @OneToMany(() => BktMastery, (mastery) => mastery.user)
  masteries: BktMastery[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
