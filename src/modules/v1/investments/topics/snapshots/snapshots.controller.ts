import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { SnapshotsService } from "./snapshots.service";
import { AuthGuard } from "../../../../../core/guards/auth.guard";
import { Me } from "../../../../../core/decorators/me.decorator";
import { TAuthUser } from "../../../../../core/types/auth.types";
import {
  PostSnapshotsBodyDto,
  postSnapshotsBodySchema,
  PostSnapshotsParamsDto,
  postSnapshotsResponseSchema,
} from "./snapshots.dto";

@ApiTags("Snapshots")
@ApiBearerAuth("bearerAuth")
@UseGuards(AuthGuard)
@Controller("investments/topics/:topicId/snapshots")
export class SnapshotsController {
  constructor(private readonly service: SnapshotsService) {}

  @Post()
  @ApiOperation({ summary: "Create a snapshot for a topic" })
  @ApiBody({ schema: postSnapshotsBodySchema })
  @ApiCreatedResponse({ schema: postSnapshotsResponseSchema })
  create(
    @Me() user: TAuthUser,
    @Param() params: PostSnapshotsParamsDto,
    @Body() body: PostSnapshotsBodyDto
  ) {
    const { value, date } = body;
    return this.service.create({ topicId: params.topicId, userId: user.id, value, date });
  }
}
