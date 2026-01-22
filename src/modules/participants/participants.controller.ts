import { Controller, Get, Param, Query } from "@nestjs/common";
import { ParticipantsService } from "./participants.service";

@Controller("/admin/participants")
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  // TODO: add @UseGuards(AdminJwtGuard)

  @Get()
  async list(@Query("limit") limit?: string, @Query("skip") skip?: string) {
    return this.participantsService.list({
      limit: limit ? Number(limit) : 50,
      skip: skip ? Number(skip) : 0,
    });
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return this.participantsService.findById(id);
  }
}
