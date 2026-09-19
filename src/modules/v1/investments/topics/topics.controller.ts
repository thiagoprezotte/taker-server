import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { TopicsService } from "./topics.service";
import { AuthGuard } from "../../../../core/guards/auth.guard";
import { Me } from "../../../../core/decorators/me.decorator";
import { TAuthUser } from "../../../../core/types/auth.types";
import {
  DeleteTopicsByIdParamsDto,
  GetTopicsByIdParamsDto,
  getTopicsByIdResponseSchema,
  GetTopicSummariesByIdParamsDto,
  getTopicSummariesByIdResponseSchema,
  getTopicsResponseSchema,
  PatchTopicsBodyDto,
  patchTopicsBodySchema,
  PatchTopicsByIdParamsDto,
  patchTopicsResponseSchema,
  PostTopicsBodyDto,
  postTopicsBodySchema,
  postTopicsResponseSchema,
} from "./topics.dto";

@ApiTags("Topics")
@ApiBearerAuth("bearerAuth")
@UseGuards(AuthGuard)
@Controller("investments/topics")
export class TopicsController {
  constructor(private readonly service: TopicsService) {}

  @Get()
  @ApiOperation({ summary: "List all topics of the current user" })
  @ApiOkResponse({ schema: getTopicsResponseSchema })
  list(@Me() user: TAuthUser) {
    return this.service.searchAll({ userId: user.id });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get topic by ID" })
  @ApiOkResponse({ schema: getTopicsByIdResponseSchema })
  getById(@Me() user: TAuthUser, @Param() params: GetTopicsByIdParamsDto) {
    return this.service.find({ id: params.id, userId: user.id });
  }

  @Get(":id/summary")
  @ApiOperation({ summary: "Get topic summary by ID" })
  @ApiOkResponse({ schema: getTopicSummariesByIdResponseSchema })
  getSummaryById(@Me() user: TAuthUser, @Param() params: GetTopicSummariesByIdParamsDto) {
    return this.service.summarize({ id: params.id, userId: user.id });
  }

  @Post()
  @ApiOperation({ summary: "Create a topic" })
  @ApiBody({ schema: postTopicsBodySchema })
  @ApiCreatedResponse({ schema: postTopicsResponseSchema })
  create(@Me() user: TAuthUser, @Body() body: PostTopicsBodyDto) {
    const { name, type, details } = body;
    return this.service.create({ userId: user.id, name, type, details });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a topic's name and/or details" })
  @ApiBody({ schema: patchTopicsBodySchema })
  @ApiOkResponse({ schema: patchTopicsResponseSchema })
  update(
    @Me() user: TAuthUser,
    @Param() params: PatchTopicsByIdParamsDto,
    @Body() body: PatchTopicsBodyDto
  ) {
    return this.service.update({ id: params.id, userId: user.id, ...body });
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Delete a topic" })
  @ApiNoContentResponse()
  async remove(@Me() user: TAuthUser, @Param() params: DeleteTopicsByIdParamsDto) {
    await this.service.delete({ id: params.id, userId: user.id });
  }
}
