import { z } from "zod";
import { createZodDto } from "../../../core/dto/zod-dto";

// zod v4 native OpenAPI 3.0 JSON Schema for @nestjs/swagger `schema` options.
const toOpenApiSchema = <T extends z.ZodType>(schema: T): any =>
  z.toJSONSchema(schema, { target: "openapi-3.0" });

const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const getUsersByIdResponseSchema = toOpenApiSchema(userDtoSchema);

const getUsersResponse = z.array(userDtoSchema);
export const getUsersResponseSchema = toOpenApiSchema(getUsersResponse);

const getUsersByIdParams = z.object({
  id: z.string(),
});
export class GetUsersByIdParamsDto extends createZodDto(getUsersByIdParams) {}

const deleteUsersByIdParams = z.object({
  id: z.string(),
});
export class DeleteUsersByIdParamsDto extends createZodDto(deleteUsersByIdParams) {}
