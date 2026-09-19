import { AsyncLocalStorage } from "async_hooks";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager } from "typeorm";

@Injectable()
export class TransactionContext {
  private static dataSource: DataSource;
  private static readonly storage = new AsyncLocalStorage<EntityManager>();

  constructor(@InjectDataSource() dataSource: DataSource) {
    TransactionContext.dataSource = dataSource;
  }

  static getManager(): EntityManager {
    const manager = TransactionContext.storage.getStore();
    if (manager) return manager;
    if (!TransactionContext.dataSource)
      throw new Error("TransactionContext is not initialized. Ensure DatabaseModule is imported in AppModule.");
    return TransactionContext.dataSource.manager;
  }

  static async run<T>(callback: () => Promise<T>): Promise<T> {
    return TransactionContext.getManager().transaction(async (manager) => {
      return TransactionContext.storage.run(manager, callback);
    });
  }
}
