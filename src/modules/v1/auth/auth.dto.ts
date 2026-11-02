import { z } from "zod";
import { createZodDto } from "../../../core/dto/zod-dto";
import { AuthMethodsOptions } from "../../../core/types/auth.types";

const toOpenApiSchema = <T extends z.ZodType>(schema: T): any =>
  z.toJSONSchema(schema, { target: "openapi-3.0" });

const authUserDtoSchema = z.object({
  authMethod: z.enum(AuthMethodsOptions),
  id: z.string(),
  email: z.string(),
  name: z.string(),
});
export const getAuthMeResponseSchema = toOpenApiSchema(authUserDtoSchema);

const authSessionDtoSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  expiresIn: z.number(),
});
export const authSessionResponseSchema = toOpenApiSchema(authSessionDtoSchema);

const getAuthUrlParams = z.object({
  provider: z.string(),
});
export class GetAuthUrlParamsDto extends createZodDto(getAuthUrlParams) {}

const getAuthUrlResponse = z.object({
  url: z.string(),
});
export const getAuthUrlResponseSchema = toOpenApiSchema(getAuthUrlResponse);

const postAuthSignupBody = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
});
export class PostAuthSignupBodyDto extends createZodDto(postAuthSignupBody) {}
export const postAuthSignupBodySchema = toOpenApiSchema(postAuthSignupBody);

const postAuthConfirmBody = z.object({
  email: z.email(),
  code: z.string(),
});
export class PostAuthConfirmBodyDto extends createZodDto(postAuthConfirmBody) {}
export const postAuthConfirmBodySchema = toOpenApiSchema(postAuthConfirmBody);

const postAuthResendBody = z.object({
  email: z.email(),
});
export class PostAuthResendBodyDto extends createZodDto(postAuthResendBody) {}
export const postAuthResendBodySchema = toOpenApiSchema(postAuthResendBody);

const postAuthLoginBody = z.object({
  email: z.email(),
  password: z.string(),
});
export class PostAuthLoginBodyDto extends createZodDto(postAuthLoginBody) {}
export const postAuthLoginBodySchema = toOpenApiSchema(postAuthLoginBody);

const postAuthCallbackBody = z.object({
  code: z.string(),
});
export class PostAuthCallbackBodyDto extends createZodDto(postAuthCallbackBody) {}
export const postAuthCallbackBodySchema = toOpenApiSchema(postAuthCallbackBody);

const postAuthRefreshBody = z.object({
  refreshToken: z.string(),
  accessToken: z.string(),
});
export class PostAuthRefreshBodyDto extends createZodDto(postAuthRefreshBody) {}
export const postAuthRefreshBodySchema = toOpenApiSchema(postAuthRefreshBody);

const postAuthForgotPasswordBody = z.object({
  email: z.email(),
});
export class PostAuthForgotPasswordBodyDto extends createZodDto(postAuthForgotPasswordBody) {}
export const postAuthForgotPasswordBodySchema = toOpenApiSchema(postAuthForgotPasswordBody);

const postAuthResetPasswordBody = z.object({
  email: z.email(),
  code: z.string(),
  password: z.string().min(8),
});
export class PostAuthResetPasswordBodyDto extends createZodDto(postAuthResetPasswordBody) {}
export const postAuthResetPasswordBodySchema = toOpenApiSchema(postAuthResetPasswordBody);
