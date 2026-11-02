import * as path from "path";

import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

const SERVER_ROOT = path.join(__dirname, "..", "..");

export interface InvServerStackProps extends cdk.StackProps {
  readonly lambdaEnvironment?: Record<string, string>;
}

export class InvServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: InvServerStackProps) {
    const { lambdaEnvironment: lambdaEnvExtra, ...stackProps } = props ?? {};
    super(scope, id, stackProps);

    const apiHandler = new NodejsFunction(this, "InvServer", {
      functionName: "InvServer",
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: path.join(SERVER_ROOT, "dist", "main.js"),
      handler: "handler",
      projectRoot: SERVER_ROOT,
      depsLockFilePath: path.join(SERVER_ROOT, "package-lock.json"),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: "production",
        ...lambdaEnvExtra,
      },
      bundling: {
        format: OutputFormat.CJS,
        externalModules: [
          "@aws-sdk/*",
          "@fastify/view",
          "@nestjs/microservices",
          "@nestjs/platform-express",
          "@nestjs/websockets",
          "class-transformer",
          "class-validator",
        ],
        minify: false,
        keepNames: true,
        sourceMap: true,
      },
    });

    const integration = new HttpLambdaIntegration("InvApiIntegration", apiHandler);

    const httpApi = new apigwv2.HttpApi(this, "InvApi", {
      apiName: "InvApi",
      description: "HTTP API → NestJS Lambda (Inv)",
      corsPreflight: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(1),
      },
    });

    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [apigwv2.HttpMethod.ANY],
      integration,
    });
  }
}
