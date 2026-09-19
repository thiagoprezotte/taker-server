import { z } from "zod";
import { createZodDto } from "../../../../../core/dto/zod-dto";

const toOpenApiSchema = <T extends z.ZodType>(schema: T): any =>
  z.toJSONSchema(schema, { target: "openapi-3.0" });

const snapshotDtoSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  date: z.string(),
  value: z.number(),
  amount: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const postSnapshotsBody = z.object({
  value: z.number().nonnegative(),
  date: z.string(),
});
export class PostSnapshotsBodyDto extends createZodDto(postSnapshotsBody) {}
export const postSnapshotsBodySchema = toOpenApiSchema(postSnapshotsBody);
export const postSnapshotsResponseSchema = toOpenApiSchema(snapshotDtoSchema);

const postSnapshotsParams = z.object({
  topicId: z.string(),
});
export class PostSnapshotsParamsDto extends createZodDto(postSnapshotsParams) {}
