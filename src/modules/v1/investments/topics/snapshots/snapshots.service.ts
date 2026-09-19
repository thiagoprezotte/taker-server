import { Injectable } from "@nestjs/common";
import { Snapshot } from "./snapshots.entity";
import { TopicsService } from "../topics.service";

@Injectable()
export class SnapshotsService {
  constructor(private readonly topicsService: TopicsService) {}

  async create({
    topicId,
    userId,
    value,
    date,
  }: { topicId: string; userId: string; value: number; date: string }): Promise<Snapshot> {
    const topic = await this.topicsService.find({ id: topicId, userId });
    return topic.createSnapshot({ value, date });
  }
}
