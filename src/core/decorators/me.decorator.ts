import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { TAuthUser } from "../types/auth.types";

export const Me = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TAuthUser | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: TAuthUser }>();
    return request.user;
  }
);
