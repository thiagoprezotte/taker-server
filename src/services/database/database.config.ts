import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSource, DataSourceOptions } from "typeorm";
import pg from "pg";

import { User } from "../../modules/v1/users/users.entity";
import { Topic } from "../../modules/v1/investments/topics/topics.entity";
import { Snapshot } from "../../modules/v1/investments/topics/snapshots/snapshots.entity";
import { Transaction } from "../../modules/v1/investments/topics/transactions/transactions.entity";

pg.types.setTypeParser(1700, (val: string) => parseFloat(val));

export function typeOrmConfig(): TypeOrmModuleOptions {
  return {
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432"),
    username: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "inv_db",
    synchronize: false,
    logging: ["error", "warn", "schema", "migration"],
    entities: [User, Topic, Snapshot, Transaction],
    migrations: [],
    subscribers: [],
  };
}

export async function dataSourceFactory(
  options?: DataSourceOptions
): Promise<DataSource> {
  if (!options) throw new Error("DataSource options are required");
  const dataSource = await new DataSource(options).initialize();

  if (process.env.NODE_ENV === "local") {
    const schemas = new Set(
      dataSource.entityMetadatas
        .map((metadata) => metadata.schema)
        .filter((schema): schema is string => !!schema)
    );
    for (const schema of schemas) {
      await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    }
    await dataSource.synchronize();
  }

  return dataSource;
}
