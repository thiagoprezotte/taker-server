import path from "path";
import { DataSource } from "typeorm";

import { typeOrmConfig } from "./database.config";

export default new DataSource({
  ...typeOrmConfig(),
  migrations: [path.join(__dirname, "migrations", "*.js")],
});
