import { z } from "zod";
import { createZodDto } from "../../../../core/dto/zod-dto";
import { TopicType } from "./topics.entity";
import { TransactionType } from "./transactions/transactions.entity";

const toOpenApiSchema = <T extends z.ZodType>(schema: T): any =>
  z.toJSONSchema(schema, { target: "openapi-3.0" });

const snapshotDtoSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  date: z.string(),
  value: z.number(),
  amount: z.number().nullable(),
});

const topicDtoSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
  name: z.string(),
  type: z.enum(TopicType),
  details: z.record(z.string(), z.any()).nullable(),
});

const transactionDtoSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  snapshotId: z.string().nullable(),
  date: z.string(),
  type: z.enum(TransactionType),
  value: z.number(),
  amount: z.number().nullable(),
});

const topicWithRelationsDtoSchema = topicDtoSchema.extend({
  snapshots: z.array(snapshotDtoSchema),
  transactions: z.array(transactionDtoSchema),
});
export const getTopicsByIdResponseSchema = toOpenApiSchema(
  topicWithRelationsDtoSchema
);

const topicListItemDtoSchema = topicDtoSchema.extend({
  currentValue: z.number().nullable(),
});

const getTopicsResponse = z.array(topicListItemDtoSchema);
export const getTopicsResponseSchema = toOpenApiSchema(getTopicsResponse);

const postTopicsBody = z.object({
  name: z.string().min(1),
  type: z.enum(TopicType),
  details: z.record(z.string(), z.any()).nullable(),
});
export class PostTopicsBodyDto extends createZodDto(postTopicsBody) {}
export const postTopicsBodySchema = toOpenApiSchema(postTopicsBody);
export const postTopicsResponseSchema = toOpenApiSchema(topicDtoSchema);

const patchTopicsBody = z.object({
  name: z.string().min(1).optional(),
  details: z.record(z.string(), z.any()).nullable().optional(),
});
export class PatchTopicsBodyDto extends createZodDto(patchTopicsBody) {}
export const patchTopicsBodySchema = toOpenApiSchema(patchTopicsBody);
export const patchTopicsResponseSchema = toOpenApiSchema(topicDtoSchema);

const patchTopicsByIdParams = z.object({
  id: z.string(),
});
export class PatchTopicsByIdParamsDto extends createZodDto(
  patchTopicsByIdParams
) {}

const getTopicsByIdParams = z.object({
  id: z.string(),
});
export class GetTopicsByIdParamsDto extends createZodDto(getTopicsByIdParams) {}

const performanceDtoSchema = z.object({
  monthly: z.number(),
  yearly: z.number(),
});

const movementDtoSchema = z.object({
  date: z.string(),
  value: z.number(),
});

const monthlySummaryDtoSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  startValue: z.number(),
  endValue: z.number(),
  balance: z.number(),
  result: z.number(),
  capitalDays: z.number(),
  performance: performanceDtoSchema,
  movements: z.array(movementDtoSchema),
});

const summaryDtoSchema = z.object({
  currentValue: z.number().nullable(),
  currentAmount: z.number().nullable(),
  mostRecentDate: z.string().nullable(),
  totalDays: z.number(),
  balance: z.number(),
  result: z.number(),
  capitalDays: z.number(),
  performance: performanceDtoSchema,
  months: z.array(monthlySummaryDtoSchema),
});

export class GetTopicSummariesByIdResponseDto extends createZodDto(summaryDtoSchema) {}
export const getTopicSummariesByIdResponseSchema = toOpenApiSchema(summaryDtoSchema);

const getTopicSummariesByIdParams = z.object({
  id: z.string(),
});
export class GetTopicSummariesByIdParamsDto extends createZodDto(getTopicSummariesByIdParams) {}

const deleteTopicsByIdParams = z.object({
  id: z.string(),
});
export class DeleteTopicsByIdParamsDto extends createZodDto(deleteTopicsByIdParams) {}
