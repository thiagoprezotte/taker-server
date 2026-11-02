import "reflect-metadata";
import awsLambdaFastify, { PromiseHandler } from "@fastify/aws-lambda";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function createApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true })
  );

  app.setGlobalPrefix("v1");

  app.enableCors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("API Reference")
    .setDescription("API")
    .setVersion("1.0.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "bearerAuth"
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document);

  return app;
}

async function bootstrap() {
  const app = await createApp();

  const port = parseInt(process.env.PORT ?? "3000", 10);
  await app.listen(port, "0.0.0.0");

  console.log(`Server running at http://localhost:${port}`);
  console.log(`API docs available at http://localhost:${port}/api-docs`);
}

async function createProxy(): Promise<PromiseHandler> {
  const app = await createApp();
  await app.init();
  return awsLambdaFastify(app.getHttpAdapter().getInstance());
}

let proxy: Promise<PromiseHandler> | undefined;

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  proxy ??= createProxy();
  return (await proxy)(event, context);
};

if (process.env.NODE_ENV === "local") bootstrap();
