import { z } from "zod";

export interface ZodDto<T extends z.ZodType = z.ZodType> {
  new (): z.infer<T>;
  schema: T;
  create(input: unknown): z.infer<T>;
}

export function isZodDto(metatype: unknown): metatype is ZodDto {
  const schema = (metatype as Partial<ZodDto> | undefined)?.schema;
  return typeof (schema as z.ZodType | undefined)?.safeParse === "function";
}

export function createZodDto<T extends z.ZodType>(schema: T): ZodDto<T> {
  class ZodDtoClass {
    static schema = schema;

    static create(input: unknown) {
      return schema.parse(input);
    }
  }

  return ZodDtoClass as unknown as ZodDto<T>;
}
