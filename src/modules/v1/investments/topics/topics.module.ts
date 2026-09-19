import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Topic } from "./topics.entity";
import { TopicsController } from "./topics.controller";
import { TopicsService } from "./topics.service";
import { Calculator } from "./calculator/calculator.engine";

@Module({
  imports: [TypeOrmModule.forFeature([Topic])],
  controllers: [TopicsController],
  providers: [TopicsService, Calculator],
  exports: [TopicsService, Calculator],
})
export class TopicsModule {}
