import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { AuthGuard } from "../../../core/guards/auth.guard";
import {
  DeleteUsersByIdParamsDto,
  GetUsersByIdParamsDto,
  getUsersByIdResponseSchema,
  getUsersResponseSchema,
} from "./users.dto";

@ApiTags("User")
@ApiBearerAuth("bearerAuth")
@UseGuards(AuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: "List all users" })
  @ApiOkResponse({ schema: getUsersResponseSchema })
  list() {
    return this.service.searchAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiOkResponse({ schema: getUsersByIdResponseSchema })
  getById(@Param() params: GetUsersByIdParamsDto) {
    return this.service.find({ id: params.id });
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a user" })
  @ApiNoContentResponse()
  async remove(@Param() params: DeleteUsersByIdParamsDto) {
    await this.service.delete({ id: params.id });
  }
}
