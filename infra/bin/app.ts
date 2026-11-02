import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import * as cdk from "aws-cdk-lib";
import { TakerServerStack } from "../lib/stack";

const LAMBDA_ENV_KEYS = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "CLOUD_REGION",
  "CLOUD_ACCESS_KEY_ID",
  "CLOUD_SECRET_ACCESS_KEY",
  "COGNITO_CLIENT_ID",
  "COGNITO_CLIENT_SECRET",
] as const;

function lambdaEnvFromProcess(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const key of LAMBDA_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      env[key] = value;
    }
  }
  return env;
}

const app = new cdk.App();

new TakerServerStack(app, "TakerServerStack", {
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
  lambdaEnvironment: lambdaEnvFromProcess(),
});
