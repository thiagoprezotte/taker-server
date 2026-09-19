import { z } from "zod";
import { createZodDto } from "../../../../../core/dto/zod-dto";
import { TransactionType } from "./transactions.entity";

const toOpenApiSchema = <T extends z.ZodType>(schema: T): any =>
  z.toJSONSchema(schema, { target: "openapi-3.0" });

const transactionDtoSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  snapshotId: z.string().nullable(),
  date: z.string(),
  type: z.enum(TransactionType),
  value: z.number(),
  amount: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const postTransactionsBody = z.object({
  type: z.enum(TransactionType),
  value: z.number().positive(),
  amount: z.number().positive().nullable(),
  date: z.string(),
});
export class PostTransactionsBodyDto extends createZodDto(postTransactionsBody) {}
export const postTransactionsBodySchema = toOpenApiSchema(postTransactionsBody);
export const postTransactionsResponseSchema = toOpenApiSchema(transactionDtoSchema);

const postTransactionsParams = z.object({
  topicId: z.string(),
});
export class PostTransactionsParamsDto extends createZodDto(postTransactionsParams) {}
