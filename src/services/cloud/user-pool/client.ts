import crypto from "crypto";
import { Injectable } from "@nestjs/common";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export interface IdentityClaims {
  email: string;
  name: string;
}

@Injectable()
export class UserPoolClient {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;
  private domain: string;
  private region: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.COGNITO_CLIENT_ID!;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET!;
    this.domain = process.env.COGNITO_DOMAIN!;
    this.region = process.env.COGNITO_REGION!;
    this.redirectUri = process.env.COGNITO_REDIRECT_URI!;

    const keyId = process.env.CLOUD_ACCESS_KEY_ID!;
    const secret = process.env.CLOUD_SECRET_ACCESS_KEY!;

    this.client = new CognitoIdentityProviderClient({
      region: this.region,
      credentials: { accessKeyId: keyId, secretAccessKey: secret },
    });
  }

  private getSecretHash(username: string): string {
    return crypto
      .createHmac("sha256", this.clientSecret)
      .update(username + this.clientId)
      .digest("base64");
  }

  private basicAuthHeader(): Record<string, string> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");
    return { Authorization: `Basic ${credentials}` };
  }

  async signUp({
    name,
    password,
    email,
  }: {
    name: string;
    password: string;
    email: string;
  }) {
    const secretHash = this.getSecretHash(email);
    const signUpCommand = new SignUpCommand({
      ClientId: this.clientId,
      SecretHash: secretHash,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
      ],
    });
    return this.client.send(signUpCommand);
  }

  async confirmSignUp({ email, code }: { email: string; code: string }) {
    const secretHash = this.getSecretHash(email);
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: code,
      SecretHash: secretHash,
    });
    return this.client.send(command);
  }

  async resendConfirmationCode({ email }: { email: string }) {
    const secretHash = this.getSecretHash(email);
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: email,
      SecretHash: secretHash,
    });
    return this.client.send(command);
  }

  async initiateAuth({ email, password }: { email: string; password: string }) {
    const secretHash = this.getSecretHash(email);
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });
    return this.client.send(command);
  }

  // Cognito verifies REFRESH_TOKEN_AUTH's SECRET_HASH against the user's
  // internal username (not the email alias), so callers must pass the
  // access token's `username` claim here.
  async refreshAuth({
    refreshToken,
    username,
  }: {
    refreshToken: string;
    username: string;
  }) {
    const secretHash = this.getSecretHash(username);
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash,
      },
    });
    return this.client.send(command);
  }

  async getUser({ accessToken }: { accessToken: string }) {
    const command = new GetUserCommand({ AccessToken: accessToken });
    return this.client.send(command);
  }

  buildAuthorizeUrl({ provider }: { provider: string }): string {
    const socialProviders: Record<string, string> = {
      google: "Google",
      linkedin: "LinkedIn",
    };
    const identityProvider = socialProviders[provider.toLowerCase()];
    if (!identityProvider) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      identity_provider: identityProvider,
      scope: "openid email profile",
    });

    return `${this.domain}/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(`${this.domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...this.basicAuthHeader(),
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${await response.text()}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      id_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }
}
