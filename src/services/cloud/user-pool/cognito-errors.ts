import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";

function mapCognitoError(error: unknown): never {
  if (error instanceof HttpException) throw error;

  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";

  switch (name) {
    case "UsernameExistsException":
      throw new ConflictException(
        "An account with this email already exists"
      );
    case "UserNotConfirmedException":
      throw new ForbiddenException("Account not confirmed");
    case "NotAuthorizedException":
    case "UserNotFoundException":
      throw new UnauthorizedException("Invalid email or password");
    case "CodeMismatchException":
      throw new BadRequestException("Invalid confirmation code");
    case "ExpiredCodeException":
      throw new BadRequestException("Confirmation code has expired");
    case "InvalidPasswordException":
      throw new BadRequestException("Password does not meet requirements");
    case "LimitExceededException":
      throw new HttpException(
        "Too many attempts, please try again later",
        HttpStatus.TOO_MANY_REQUESTS
      );
    default:
      break;
  }

  throw new InternalServerErrorException(
    error instanceof Error ? error.message : "Unexpected error"
  );
}

export async function withCognitoError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    mapCognitoError(error);
  }
}
