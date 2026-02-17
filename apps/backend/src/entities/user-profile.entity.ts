import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "user_profiles" })
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  user_id!: string;

  @Column({ type: "varchar", default: "Ashi" })
  first_name!: string;

  @Column({
    type: "simple-array",
    default: "gymnastics,cute puppies",
  })
  thematic_interests!: string[];

  @Column({ type: "int", default: 6 })
  math_level!: number;

  @Column({ type: "int", default: 4 })
  ela_level!: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;
}
