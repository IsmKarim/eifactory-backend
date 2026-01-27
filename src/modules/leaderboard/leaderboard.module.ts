import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LeaderboardController } from "./leaderboard.controller";
import { LeaderboardService } from "./leaderboard.service";

import { Attempt, AttemptSchema } from "../attempts/schemas/attempt.schema";
import { Session, SessionSchema } from "../session/session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attempt.name, schema: AttemptSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
