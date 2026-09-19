import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Topic } from "../topics.entity";

@Entity({ name: "snapshots", schema: "investments" })
export class Snapshot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
  
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @Column({ name: "topic_id", type: "uuid" })
  topicId: string;

  @ManyToOne(() => Topic, (topic) => topic.snapshots)
  @JoinColumn({ name: "topic_id" })
  topic?: Relation<Topic>;

  @Column({ name: "date", type: "date" })
  date: string;

  @Column({ name: "value", type: "decimal", precision: 10, scale: 2 })
  value: number;

  @Column({ name: "amount", type: "decimal", precision: 10, scale: 2, nullable: true })
  amount: number | null;
}
