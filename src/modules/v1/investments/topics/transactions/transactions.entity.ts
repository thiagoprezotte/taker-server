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

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
}

@Entity({ name: "transactions", schema: "investments" })
export class Transaction {
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

  @ManyToOne(() => Topic, (topic) => topic.transactions)
  @JoinColumn({ name: "topic_id" })
  topic?: Relation<Topic>;

  @Column({ name: "snapshot_id", type: "uuid", nullable: true })
  snapshotId: string | null;

  @Column({ name: "date", type: "date" })
  date: string;

  @Column({ name: "type", type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({ name: "value", type: "decimal", precision: 10, scale: 2 })
  value: number;

  @Column({ name: "amount", type: "decimal", precision: 10, scale: 2, nullable: true })
  amount: number | null;
}
