import { Global, Module } from "@nestjs/common";
import { TransactionContext } from "./transaction.context";

@Global()
@Module({
  providers: [TransactionContext],
  exports: [TransactionContext],
})
export class DatabaseModule {}
