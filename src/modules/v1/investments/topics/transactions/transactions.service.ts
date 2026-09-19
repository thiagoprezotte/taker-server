import { Injectable } from "@nestjs/common";
import { Transaction, TransactionType } from "./transactions.entity";
import { TopicsService } from "../topics.service";
import { TransactionContext } from "../../../../../services/database/transaction.context";

@Injectable()
export class TransactionsService {
  constructor(private readonly topicsService: TopicsService) {}

  async create({
    topicId,
    userId,
    type,
    value,
    amount,
    date,
  }: {
    topicId: string;
    userId: string;
    type: TransactionType;
    value: number;
    amount: number | null;
    date: string;
  }): Promise<Transaction> {
    const topic = await this.topicsService.find({ id: topicId, userId });
    return TransactionContext.run(() =>
      topic.createTransaction({ type, value, amount, date })
    );
  }
}
