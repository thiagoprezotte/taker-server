import { Global, Module } from "@nestjs/common";
import { UserPoolClient } from "./user-pool/client";

@Global()
@Module({
  providers: [UserPoolClient],
  exports: [UserPoolClient],
})
export class CloudModule {}
