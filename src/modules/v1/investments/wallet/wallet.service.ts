import { Injectable } from "@nestjs/common";
import { TopicsService } from "../topics/topics.service";
import { Calculator, Period, Wallet } from "../topics/calculator/calculator.engine";

const OPEN_START = "0000-01";
const OPEN_END = "9999-12";

@Injectable()
export class WalletService {
  constructor(
    private readonly topicsService: TopicsService,
    private readonly calculator: Calculator
  ) {}

  private toPeriod({ from, to }: { from?: string; to?: string }): Period | null {
    if (!from && !to) return null;

    const start = from ?? OPEN_START;
    const end = to ?? OPEN_END;

    return start <= end ? { from: start, to: end } : { from: end, to: start };
  }

  async consolidate({
    userId,
    from,
    to,
  }: { userId: string; from?: string; to?: string }): Promise<Wallet> {
    const topics = await this.topicsService.searchAllDetailed({ userId });
    return this.calculator.consolidate({ topics, period: this.toPeriod({ from, to }) });
  }
}
