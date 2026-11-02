import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthGuard } from "../../../core/guards/auth.guard";
import { Me } from "../../../core/decorators/me.decorator";
import { TAuthUser } from "../../../core/types/auth.types";
import {
  authSessionResponseSchema,
  getAuthMeResponseSchema,
  postAuthConfirmBodySchema,
  PostAuthConfirmBodyDto,
  postAuthForgotPasswordBodySchema,
  PostAuthForgotPasswordBodyDto,
  postAuthLoginBodySchema,
  PostAuthLoginBodyDto,
  postAuthRefreshBodySchema,
  PostAuthRefreshBodyDto,
  postAuthResendBodySchema,
  PostAuthResendBodyDto,
  postAuthResetPasswordBodySchema,
  PostAuthResetPasswordBodyDto,
  postAuthSignupBodySchema,
  PostAuthSignupBodyDto,
} from "./auth.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth("bearerAuth")
  @ApiOperation({ summary: "Get the current authenticated user" })
  @ApiOkResponse({ schema: getAuthMeResponseSchema })
  me(@Me() user: TAuthUser) {
    return user;
  }

  @Post("signup")
  @ApiOperation({ summary: "Register a new account with email and password" })
  @ApiBody({ schema: postAuthSignupBodySchema })
  async signup(@Body() body: PostAuthSignupBodyDto): Promise<void> {
    const { email, password, name } = body;
    await this.authService.signUp({ email, password, name });
  }

  @Post("confirm")
  @ApiOperation({ summary: "Confirm an account with the emailed verification code" })
  @ApiBody({ schema: postAuthConfirmBodySchema })
  async confirm(@Body() body: PostAuthConfirmBodyDto): Promise<void> {
    const { email, code } = body;
    await this.authService.confirm({ email, code });
  }

  @Post("resend")
  @ApiOperation({ summary: "Resend the confirmation code" })
  @ApiBody({ schema: postAuthResendBodySchema })
  async resend(@Body() body: PostAuthResendBodyDto): Promise<void> {
    const { email } = body;
    await this.authService.resend({ email });
  }

  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ schema: postAuthLoginBodySchema })
  @ApiCreatedResponse({ schema: authSessionResponseSchema })
  login(@Body() body: PostAuthLoginBodyDto) {
    const { email, password } = body;
    return this.authService.login({ email, password });
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh a session using a refresh token" })
  @ApiBody({ schema: postAuthRefreshBodySchema })
  @ApiCreatedResponse({ schema: authSessionResponseSchema })
  refresh(@Body() body: PostAuthRefreshBodyDto) {
    const { refreshToken, accessToken } = body;
    return this.authService.refresh({ refreshToken, accessToken });
  }

  @Post("forgot")
  @ApiOperation({ summary: "Send a password reset code to the account email" })
  @ApiBody({ schema: postAuthForgotPasswordBodySchema })
  async forgotPassword(@Body() body: PostAuthForgotPasswordBodyDto): Promise<void> {
    const { email } = body;
    await this.authService.forgotPassword({ email });
  }

  @Post("reset")
  @ApiOperation({ summary: "Set a new password with the emailed reset code" })
  @ApiBody({ schema: postAuthResetPasswordBodySchema })
  async resetPassword(@Body() body: PostAuthResetPasswordBodyDto): Promise<void> {
    const { email, code, password } = body;
    await this.authService.resetPassword({ email, code, password });
  }
}
