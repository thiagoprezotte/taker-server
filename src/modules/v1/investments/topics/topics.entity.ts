import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Snapshot } from "./snapshots/snapshots.entity";
import { Transaction, TransactionType } from "./transactions/transactions.entity";
import { Repository } from "typeorm";
import { TransactionContext } from "../../../../services/database/transaction.context";
import { BadRequestException } from "@nestjs/common";

export enum TopicType {
  EQUITY = "EQUITY",
  BOND = "BOND",
}

export interface TopicMovement {
  date: string
  value: number
}

export interface TopicValuation {
  date: string
  value: number
  amount: number | null
}

export interface TopicInterval {
  startDate: string
  endDate: string
  totalDays: number
  startValue: number
  endValue: number
  balance: number
  result: number
  movements: TopicMovement[]
}

@Entity({ name: "topics", schema: "investments" })
export class Topic {
  private get snapshotRepository(): Repository<Snapshot> {
    return TransactionContext.getManager().getRepository(Snapshot);
  }

  private get transactionRepository(): Repository<Transaction> {
    return TransactionContext.getManager().getRepository(Transaction);
  }

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column()
  name: string;

  @Column({ type: "enum", enum: TopicType })
  type: TopicType;

  @Column({ type: "jsonb", nullable: true })
  details: Record<string, any> | null;

  @OneToMany(() => Snapshot, (snapshot) => snapshot.topic)
  snapshots?: Snapshot[];

  @OneToMany(() => Transaction, (transaction) => transaction.topic)
  transactions?: Transaction[];

  private sortAscendent<T extends (Snapshot | Transaction)>(registries: T[]): T[] {
    return registries.sort((a, b) => {
      if (new Date(a.date).getTime() > new Date(b.date).getTime()) return 1;
      if (new Date(a.date).getTime() < new Date(b.date).getTime()) return -1;
      if (new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime()) return 1;
      if (new Date(a.createdAt).getTime() < new Date(b.createdAt).getTime()) return -1;
      return 0;
    })
  }

  private async fetchSnapshots(): Promise<Snapshot[]> {
    if (this.snapshots === undefined) {
      this.snapshots = await this.snapshotRepository.find({
        where: { topicId: this.id },
      });
    }
    return this.sortAscendent(this.snapshots);
  }

  private async fetchTransactions(): Promise<Transaction[]> {
    if (this.transactions === undefined) {
      this.transactions = await this.transactionRepository.find({
        where: { topicId: this.id },
      });
    }
    return this.sortAscendent(this.transactions);
  }

  private calculateDaysBetween(fromDate: string, toDate: string): number {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private toDateKey(date: string): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private toMovement(transaction: Transaction): TopicMovement {
    return {
      date: this.toDateKey(transaction.date),
      value: transaction.type === TransactionType.DEPOSIT ? transaction.value : transaction.value * -1,
    };
  }

  private toValuation(snapshot: Snapshot): TopicValuation {
    return {
      date: this.toDateKey(snapshot.date),
      value: snapshot.value,
      amount: snapshot.amount,
    };
  }

  private async fetchValuationPoints(): Promise<TopicValuation[]> {
    const snapshots = await this.fetchSnapshots();
    const movements = await this.fetchMovements();

    const movementDates = new Set(movements.map((movement) => movement.date));
    const points = new Map<string, TopicValuation>();

    for (const snapshot of snapshots) {
      const valuation = this.toValuation(snapshot);
      if (movementDates.has(valuation.date)) continue;

      points.set(valuation.date, valuation);
    }

    return [...points.values()];
  }

  private openingOf({
    valuations,
    movements,
  }: { valuations: TopicValuation[]; movements: TopicMovement[] }): TopicValuation {
    const [firstValuation] = valuations;
    const [firstMovement] = movements;

    if (!!firstMovement && firstMovement.date < firstValuation.date)
      return { date: firstMovement.date, value: 0, amount: null };

    return firstValuation;
  }

  private buildInterval({
    start,
    end,
    movements,
  }: { start: TopicValuation; end: TopicValuation; movements: TopicMovement[] }): TopicInterval {
    const intervalMovements = movements.filter(
      (movement) => movement.date >= start.date && movement.date <= end.date
    );
    const balance = intervalMovements.reduce((acc, movement) => acc + movement.value, 0);

    return {
      startDate: start.date,
      endDate: end.date,
      totalDays: this.calculateDaysBetween(start.date, end.date),
      startValue: start.value,
      endValue: end.value,
      balance,
      result: end.value - start.value - balance,
      movements: intervalMovements,
    };
  }

  async calculateTopicIntervals(): Promise<TopicInterval[]> {
    const valuations = await this.fetchValuationPoints();
    if (valuations.length === 0) return [];

    const movements = await this.fetchMovements();

    const intervals: TopicInterval[] = [];
    let start = this.openingOf({ valuations, movements });

    for (const valuation of valuations) {
      if (valuation.date <= start.date) continue;

      intervals.push(this.buildInterval({ start, end: valuation, movements }));
      start = valuation;
    }

    return intervals;
  }

  async fetchMovements(): Promise<TopicMovement[]> {
    const transactions = await this.fetchTransactions();
    return transactions.map((transaction) => this.toMovement(transaction));
  }

  async fetchLatestValuation(): Promise<TopicValuation | null> {
    const snapshot = await this.fetchLastSnapshot();
    return snapshot === null ? null : this.toValuation(snapshot);
  }

  private async fetchLastSnapshot(): Promise<Snapshot | null> {
    if (this.snapshots === undefined) {
      const lastSnapshot = await this.snapshotRepository.findOne({
        where: { topicId: this.id },
        order: { date: "DESC", createdAt: "DESC" },
      });
      return lastSnapshot;
    }

    const orderedSnapshots = this.sortAscendent(this.snapshots);
    return orderedSnapshots[orderedSnapshots.length - 1] ?? null;
  }

  async createSnapshot({
    value,
    date,
  }: { value: number; date: string }): Promise<Snapshot> {
    const lastSnapshot = await this.fetchLastSnapshot();

    if (!!lastSnapshot && this.calculateDaysBetween(lastSnapshot.date, date) < 0)
      throw new BadRequestException("You cannot create a snapshot before the most recent one. Remove it first!");

    const snapshot = this.snapshotRepository.create({
      topicId: this.id,
      date,
      value,
      amount: lastSnapshot?.amount ?? null,
    });

    return this.snapshotRepository.save(snapshot);
  }

  async createTransaction({
    type,
    value,
    amount,
    date,
  }: { type: TransactionType; value: number; amount: number | null; date: string }): Promise<Transaction> {
    const lastSnapshot = await this.fetchLastSnapshot();

    if (!!lastSnapshot && this.calculateDaysBetween(lastSnapshot.date, date) < 0)
      throw new BadRequestException("You cannot create a transaction before the most recent snapshot. Remove it first!");

    const transaction = this.transactionRepository.create({
      topicId: this.id,
      type: type,
      date,
      value,
      amount,
    });

    if (this.type !== TopicType.EQUITY) return await this.transactionRepository.save(transaction);

    if (!amount) throw new BadRequestException("Amount is required for EQUITY topics");

    const transactionValuePerAmount = value / amount;
    const transactionAmount = transaction.type === TransactionType.DEPOSIT ? amount : -amount;
    const currentAmount = (lastSnapshot?.amount ?? 0) + transactionAmount;

    if (currentAmount < 0) throw new BadRequestException("Withdrawal amount exceeds current amount");

    const snapshot = await this.snapshotRepository.save(this.snapshotRepository.create({
      topicId: this.id,
      date,
      value: transactionValuePerAmount * currentAmount,
      amount: currentAmount,
    }));

    transaction.snapshotId = snapshot.id;
    return await this.transactionRepository.save(transaction);
  }
}
