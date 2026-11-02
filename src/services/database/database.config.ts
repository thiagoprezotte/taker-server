import { DataSourceOptions } from "typeorm";
import pg from "pg";

import { User } from "../../modules/v1/users/users.entity";
import { Topic } from "../../modules/v1/investments/topics/topics.entity";
import { Snapshot } from "../../modules/v1/investments/topics/snapshots/snapshots.entity";
import { Transaction } from "../../modules/v1/investments/topics/transactions/transactions.entity";

pg.types.setTypeParser(1700, (val: string) => parseFloat(val));

export function typeOrmConfig(): DataSourceOptions {
  return {
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432"),
    username: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "taker_db",
    ssl: process.env.NODE_ENV !== "local" && { rejectUnauthorized: false },
    synchronize: false,
    logging: ["error", "warn", "schema", "migration"],
    entities: [
      User,
      Topic,
      Snapshot,
      Transaction,
    ],
  };
}
