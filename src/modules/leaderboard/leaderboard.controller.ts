import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service";
import { LeaderboardQueryDto } from "./dto/leaderboard-query.dto";
import { AdminJwtGuard } from "src/common/guards/admin-jwt.guard";

@UseGuards(AdminJwtGuard)
@Controller("/admin/leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query() q: LeaderboardQueryDto) {
    const data = await this.leaderboardService.getLeaderboardGroupedBySessions({
      sessionId: q.sessionId,
      limit: q.limit,
    });

    return {
      sort: { primary: "score_desc", secondary: "elapsedMs_asc" },
      data,
    };
  }
}
