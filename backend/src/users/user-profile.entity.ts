import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  user_id!: string;

  @Column({ default: 'Ashi' })
  first_name!: string;

  @Column('text', {
    array: true,
    default: () => "ARRAY['gymnastics','cute puppies']",
  })
  thematic_interests!: string[];

  @Column({ type: 'int', default: 6 })
  math_level!: number;

  @Column({ type: 'int', default: 4 })
  ela_level!: number;
}
