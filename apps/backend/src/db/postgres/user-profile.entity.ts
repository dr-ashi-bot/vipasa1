import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user_profile' })
export class UserProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  user_id!: string;

  @Column({ type: 'text', default: 'Ashi' })
  first_name!: string;

  @Column({
    type: 'text',
    array: true,
    default: () => "ARRAY['gymnastics','cute puppies']::text[]",
  })
  thematic_interests!: string[];

  @Column({ type: 'int', default: 6 })
  math_level!: number;

  @Column({ type: 'int', default: 4 })
  ela_level!: number;
}
