import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { WalletService } from "./wallet.service";
import { AuthGuard } from "../../../../core/guards/auth.guard";
import { Me } from "../../../../core/decorators/me.decorator";
import { TAuthUser } from "../../../../core/types/auth.types";
import { GetWalletQueryDto, getWalletResponseSchema } from "./wallet.dto";

@ApiTags("Wallet")
@ApiBearerAuth("bearerAuth")
@UseGuards(AuthGuard)
@Controller("investments/wallet")
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Get()
  @ApiOperation({ summary: "Get the consolidated wallet of the current user" })
  @ApiQuery({ name: "from", required: false, example: "2025-01" })
  @ApiQuery({ name: "to", required: false, example: "2025-12" })
  @ApiOkResponse({ schema: getWalletResponseSchema })
  get(@Me() user: TAuthUser, @Query() query: GetWalletQueryDto) {
    return this.service.consolidate({ userId: user.id, from: query.from, to: query.to });
  }
}
