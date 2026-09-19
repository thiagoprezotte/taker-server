import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { TAuthUser } from "../types/auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: TAuthUser }>();

    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    return true;
  }
}
