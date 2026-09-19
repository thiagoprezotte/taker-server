import { Injectable, NotFoundException } from "@nestjs/common";
import { Topic, TopicType } from "./topics.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Calculator } from "./calculator/calculator.engine";

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly repository: Repository<Topic>,
    private readonly calculator: Calculator
  ) { }

  async searchAll({ userId }: { userId: string }) {
    const topics = await this.repository.find({
      where: { userId },
      relations: { snapshots: true },
      order: { createdAt: "DESC" },
    });

    return Promise.all(
      topics.map(async (topic) => {
        const valuation = await topic.fetchLatestValuation();
        const { snapshots, ...rest } = topic;
        return { ...rest, currentValue: valuation?.value ?? null };
      })
    );
  }

  searchAllDetailed({ userId }: { userId: string }) {
    return this.repository.find({
      where: { userId },
      relations: { snapshots: true, transactions: true },
      order: { createdAt: "DESC" },
    });
  }

  async find({ id, userId }: { id: string; userId: string }) {
    const topic = await this.repository.findOne({
      where: { id, userId },
      relations: { snapshots: true, transactions: true },
    });
    if (!topic) throw new NotFoundException("Topic not found");

    return topic;
  }

  async summarize({ id, userId }: { id: string; userId: string }) {
    const topic = await this.find({ id, userId });
    return this.calculator.summarize({ topic });
  }

  async create({
    userId,
    name,
    type,
    details
  }: { userId: string; name: string; type: TopicType; details: Record<string, any> | null }): Promise<Topic> {
    const topic = this.repository.create({
      userId,
      name,
      type,
      details: details,
    });
    return this.repository.save(topic);
  }

  async update({
    id,
    userId,
    ...input
  }: { id: string; userId: string; name?: string; details?: Record<string, any> | null }): Promise<Topic> {
    const topic = await this.find({ id, userId });
    if (!topic) throw new NotFoundException("Topic not found");
    if (input.name !== undefined) topic.name = input.name;
    if (input.details !== undefined) topic.details = input.details;
    return this.repository.save(topic);
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    await this.find({ id, userId });
    return this.repository.softDelete({ id });
  }
}
