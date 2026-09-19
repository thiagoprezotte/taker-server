import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { TransactionsService } from "./transactions.service";
import { AuthGuard } from "../../../../../core/guards/auth.guard";
import { Me } from "../../../../../core/decorators/me.decorator";
import { TAuthUser } from "../../../../../core/types/auth.types";
import {
  PostTransactionsBodyDto,
  postTransactionsBodySchema,
  PostTransactionsParamsDto,
  postTransactionsResponseSchema,
} from "./transactions.dto";

@ApiTags("Transactions")
@ApiBearerAuth("bearerAuth")
@UseGuards(AuthGuard)
@Controller("investments/topics/:topicId/transactions")
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a transaction for a topic" })
  @ApiBody({ schema: postTransactionsBodySchema })
  @ApiCreatedResponse({ schema: postTransactionsResponseSchema })
  create(
    @Me() user: TAuthUser,
    @Param() params: PostTransactionsParamsDto,
    @Body() body: PostTransactionsBodyDto
  ) {
    const { type, value, amount, date } = body;
    return this.service.create({
      topicId: params.topicId,
      userId: user.id,
      type,
      value,
      amount,
      date,
    });
  }
}
