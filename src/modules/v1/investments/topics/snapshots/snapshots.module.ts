import { Module } from "@nestjs/common";
import { TopicsModule } from "../topics.module";
import { SnapshotsController } from "./snapshots.controller";
import { SnapshotsService } from "./snapshots.service";

@Module({
  imports: [TopicsModule],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
