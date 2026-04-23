import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LeaderboardController } from "./leaderboard.controller";
import { LeaderboardService } from "./leaderboard.service";

import { Attempt, AttemptSchema } from "../attempts/schemas/attempt.schema";
import { Session, SessionSchema } from "../session/session.schema";
import { Participant, ParticipantSchema } from "../participants/schemas/participant.schema";
import { Event, EventSchema } from "../events/event.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attempt.name, schema: AttemptSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Participant.name, schema: ParticipantSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
