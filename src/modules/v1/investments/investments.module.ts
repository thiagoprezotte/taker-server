import { Module } from "@nestjs/common";
import { TopicsModule } from "./topics/topics.module";
import { SnapshotsModule } from "./topics/snapshots/snapshots.module";
import { TransactionsModule } from "./topics/transactions/transactions.module";
import { WalletModule } from "./wallet/wallet.module";

@Module({
  imports: [TopicsModule, SnapshotsModule, TransactionsModule, WalletModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class InvestmentsModule {}
