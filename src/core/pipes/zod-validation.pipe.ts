import {
  ArgumentMetadata,
  BadRequestException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { isZodDto } from "../dto/zod-dto";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const { metatype } = metadata;

    if (!isZodDto(metatype)) return value;

    const result = metatype.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Validation failed",
        errors: result.error.issues,
      });
    }

    return result.data;
  }
}
