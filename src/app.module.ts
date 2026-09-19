import { Module } from "@nestjs/common";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { typeOrmConfig, dataSourceFactory } from "./services/database/database.config";
import { DatabaseModule } from "./services/database/database.module";
import { CloudModule } from "./services/cloud/cloud.module";
import { AuthModule } from "./modules/v1/auth/auth.module";
import { HealthModule } from "./modules/v1/health/health.module";
import { InvestmentsModule } from "./modules/v1/investments/investments.module";
import { UsersModule } from "./modules/v1/users/users.module";
import { ZodValidationPipe } from "./core/pipes/zod-validation.pipe";
import { MeGuard } from "./core/guards/me.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmConfig, dataSourceFactory }),
    DatabaseModule,
    CloudModule,
    AuthModule,
    HealthModule,
    InvestmentsModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_GUARD, useClass: MeGuard },
  ],
})
export class AppModule {}
