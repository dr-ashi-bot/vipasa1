import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SubjectTrack } from "../learning/types";

@Entity({ name: "bkt_mastery" })
@Index("uq_user_concept_track", ["user_id", "concept_id", "track"], {
  unique: true,
})
@Check(`"probability_known" >= 0.0 AND "probability_known" <= 1.0`)
export class BKTMastery {
  @PrimaryGeneratedColumn("uuid")
  mastery_id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "varchar", length: 128 })
  concept_id!: string;

  @Column({ type: "varchar", length: 16 })
  track!: SubjectTrack;

  @Column({ type: "float", default: 0.25 })
  probability_known!: number;

  @Column({ type: "float", default: 0.1 })
  slip!: number;

  @Column({ type: "float", default: 0.2 })
  guess!: number;

  @Column({ type: "float", default: 0.15 })
  transition!: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;
}
