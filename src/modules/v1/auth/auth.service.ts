import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { UserPoolClient } from "../../../services/cloud/user-pool/client";
import { UsersService } from "../users/users.service";

interface AuthSession {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userPoolClient: UserPoolClient,
    private readonly usersService: UsersService
  ) {}

  buildAuthorizeUrl({ provider }: { provider: string }): string {
    return this.userPoolClient.buildAuthorizeUrl({ provider });
  }

  async signUp({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }): Promise<void> {
    const user = await this.usersService.searchByEmail({ email });
    if (!!user) throw new BadRequestException("User already exists");
    await this.usersService.upsert({ email, name });
    await this.userPoolClient.signUp({ email, password, name });
  }

  async confirm({
    email,
    code,
  }: {
    email: string;
    code: string;
  }): Promise<void> {
    const user = await this.usersService.searchByEmail({ email });
    if (!user) throw new BadRequestException("User not found");
    await this.userPoolClient.confirmSignUp({ email, code });
  }

  async resend({ email }: { email: string }): Promise<void> {
    const user = await this.usersService.searchByEmail({ email });
    if (!user) throw new BadRequestException("User not found");
    await this.userPoolClient.resendConfirmationCode({ email });
  }

  async login({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthSession> {
    const user = await this.usersService.searchByEmail({ email });
    if (!user) throw new BadRequestException("User not found");

    const result = await this.userPoolClient.initiateAuth({ email, password });

    if (!result.AuthenticationResult?.AccessToken)
      throw new UnauthorizedException("Invalid email or password");

    return {
      accessToken: result.AuthenticationResult.AccessToken,
      refreshToken: result.AuthenticationResult.RefreshToken ?? null,
      expiresIn: result.AuthenticationResult.ExpiresIn ?? 3600,
    };
  }

  async exchangeCode({ code }: { code: string }): Promise<AuthSession> {
    const { accessToken, refreshToken, expiresIn } =
      await this.userPoolClient.exchangeCode(code);
    return {
      accessToken,
      refreshToken: refreshToken ?? null,
      expiresIn,
    };
  }

  async refresh({
    refreshToken,
    accessToken,
  }: {
    refreshToken: string;
    accessToken: string;
  }): Promise<AuthSession> {
    const username = this.decodeUsername(accessToken);

    const result = await this.userPoolClient.refreshAuth({
      refreshToken,
      username,
    });

    if (!result.AuthenticationResult?.AccessToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return {
      accessToken: result.AuthenticationResult.AccessToken,
      refreshToken: result.AuthenticationResult.RefreshToken ?? null,
      expiresIn: result.AuthenticationResult.ExpiresIn ?? 3600,
    };
  }

  async forgotPassword({ email }: { email: string }): Promise<void> {
    const user = await this.usersService.searchByEmail({ email });
    if (!user) throw new BadRequestException("User not found");
    await this.userPoolClient.forgotPassword({ email });
  }

  async resetPassword({
    email,
    code,
    password,
  }: {
    email: string;
    code: string;
    password: string;
  }): Promise<void> {
    const user = await this.usersService.searchByEmail({ email });
    if (!user) throw new BadRequestException("User not found");
    await this.userPoolClient.confirmForgotPassword({ email, code, password });
  }

  private decodeUsername(accessToken: string): string {
    try {
      const payload = accessToken.split(".")[1] ?? "";
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (typeof claims.username !== "string") throw new Error();
      return claims.username;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }
}
