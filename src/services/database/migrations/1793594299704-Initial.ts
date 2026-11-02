import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1793594299704 implements MigrationInterface {
  name = "Initial1793594299704";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA "investments"`);
    await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "investments"."snapshots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "topic_id" uuid NOT NULL, "date" date NOT NULL, "value" numeric(10,2) NOT NULL, "amount" numeric(10,2), CONSTRAINT "PK_f5661b5fd4224d23e26a631986b" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TYPE "investments"."transactions_type_enum" AS ENUM('DEPOSIT', 'WITHDRAWAL')`);
    await queryRunner.query(`CREATE TABLE "investments"."transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "topic_id" uuid NOT NULL, "snapshot_id" uuid, "date" date NOT NULL, "type" "investments"."transactions_type_enum" NOT NULL, "value" numeric(10,2) NOT NULL, "amount" numeric(10,2), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TYPE "investments"."topics_type_enum" AS ENUM('EQUITY', 'BOND')`);
    await queryRunner.query(`CREATE TABLE "investments"."topics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "name" character varying NOT NULL, "type" "investments"."topics_type_enum" NOT NULL, "details" jsonb, CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "investments"."snapshots" ADD CONSTRAINT "FK_32bb91e8f2b31aec3ed5af99f0a" FOREIGN KEY ("topic_id") REFERENCES "investments"."topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "investments"."transactions" ADD CONSTRAINT "FK_ba8b05239065a654c5300ec10f0" FOREIGN KEY ("topic_id") REFERENCES "investments"."topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "investments"."transactions" DROP CONSTRAINT "FK_ba8b05239065a654c5300ec10f0"`);
    await queryRunner.query(`ALTER TABLE "investments"."snapshots" DROP CONSTRAINT "FK_32bb91e8f2b31aec3ed5af99f0a"`);
    await queryRunner.query(`DROP TABLE "investments"."topics"`);
    await queryRunner.query(`DROP TYPE "investments"."topics_type_enum"`);
    await queryRunner.query(`DROP TABLE "investments"."transactions"`);
    await queryRunner.query(`DROP TYPE "investments"."transactions_type_enum"`);
    await queryRunner.query(`DROP TABLE "investments"."snapshots"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP SCHEMA "investments"`);
  }
}
