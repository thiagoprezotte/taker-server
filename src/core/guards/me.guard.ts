import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { UserPoolClient } from "../../services/cloud/user-pool/client";
import { UsersService } from "../../modules/v1/users/users.service";
import { TAuthUser } from "../types/auth.types";

@Injectable()
export class MeGuard implements CanActivate {
  constructor(
    private readonly userPoolClient: UserPoolClient,
    private readonly usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: TAuthUser }>();

    if (request.headers.authorization) {
      request.user = await this.validateAuth(request.headers.authorization);
    }

    return true;
  }

  private async validateAuth(authorization: string): Promise<TAuthUser> {
    if (!/^bearer\s+/i.test(authorization.trim())) {
      throw new UnauthorizedException(
        "Invalid authorization format. Expected: Bearer <token>"
      );
    }

    const accessToken = authorization.replace(/^bearer\s+/i, "").trim();

    try {
      const poolUser = await this.userPoolClient.getUser({ accessToken });

      const email = poolUser.UserAttributes?.find(
        (attribute) => attribute.Name === "email"
      )?.Value;
      if (!email) throw new UnauthorizedException("Invalid or expired token");

      const user = await this.usersService.searchByEmail({ email });
      if (!user) throw new UnauthorizedException("User not found");

      return {
        authMethod: "BEARER_TOKEN",
        id: user.id,
        email: user.email,
        name: user.name,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
