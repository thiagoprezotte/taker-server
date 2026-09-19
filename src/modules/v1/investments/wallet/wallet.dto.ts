import { z } from "zod";
import { createZodDto } from "../../../../core/dto/zod-dto";
import { TopicType } from "../topics/topics.entity";

const toOpenApiSchema = <T extends z.ZodType>(schema: T): any =>
  z.toJSONSchema(schema, { target: "openapi-3.0" });

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

const cashFlowDtoSchema = z.object({
  month: z.string(),
  deposits: z.number(),
  withdrawals: z.number(),
  balance: z.number(),
  movements: z.number(),
});

const calendarMonthDtoSchema = z.object({
  month: z.string(),
  result: z.number(),
  movements: z.number(),
  measured: z.boolean(),
});

const walletSliceDtoSchema = z.object({
  topics: z.number(),
  openingValue: z.number(),
  currentValue: z.number(),
  deposits: z.number(),
  withdrawals: z.number(),
  investedCapital: z.number(),
  result: z.number(),
  totalDays: z.number(),
  capitalDays: z.number(),
  performance: performanceDtoSchema,
  months: z.array(monthlySummaryDtoSchema),
  cashFlow: z.array(cashFlowDtoSchema),
});

const walletSegmentDtoSchema = walletSliceDtoSchema.extend({
  type: z.enum(TopicType),
  share: z.number(),
});

const walletPositionDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(TopicType),
  currentValue: z.number(),
  currentAmount: z.number().nullable(),
  mostRecentDate: z.string().nullable(),
  deposits: z.number(),
  withdrawals: z.number(),
  investedCapital: z.number(),
  result: z.number(),
  totalDays: z.number(),
  capitalDays: z.number(),
  performance: performanceDtoSchema,
  share: z.number(),
});

const walletMovementDtoSchema = movementDtoSchema.extend({
  topicId: z.string(),
  topicName: z.string(),
  topicType: z.enum(TopicType),
});

const walletDtoSchema = walletSliceDtoSchema.extend({
  segments: z.array(walletSegmentDtoSchema),
  positions: z.array(walletPositionDtoSchema),
  movements: z.array(walletMovementDtoSchema),
  calendar: z.array(calendarMonthDtoSchema),
});

export const getWalletResponseSchema = toOpenApiSchema(walletDtoSchema);

const monthKey = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");

const getWalletQuery = z.object({
  from: monthKey.optional(),
  to: monthKey.optional(),
});
export class GetWalletQueryDto extends createZodDto(getWalletQuery) {}
export const getWalletQuerySchema = toOpenApiSchema(getWalletQuery);
