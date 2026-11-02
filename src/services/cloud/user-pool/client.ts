import crypto from "crypto";
import { Injectable } from "@nestjs/common";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  InitiateAuthCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { withCognitoError } from "./cognito-errors";

@Injectable()
export class UserPoolClient {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;
  private region: string;

  constructor() {
    this.clientId = process.env.COGNITO_CLIENT_ID!;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET!;
    this.region = process.env.CLOUD_REGION!;

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

  async forgotPassword({ email }: { email: string }) {
    const secretHash = this.getSecretHash(email);
    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
      SecretHash: secretHash,
    });
    return withCognitoError(() => this.client.send(command));
  }

  async confirmForgotPassword({
    email,
    code,
    password,
  }: {
    email: string;
    code: string;
    password: string;
  }) {
    const secretHash = this.getSecretHash(email);
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: code,
      Password: password,
      SecretHash: secretHash,
    });
    return withCognitoError(() => this.client.send(command));
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
}
