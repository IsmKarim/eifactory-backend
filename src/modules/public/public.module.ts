import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";

import { ParticipantsModule } from "../participants/participants.module";
import { AttemptsModule } from "../attempts/attempts.module";
import { SessionsModule } from "../session/session.module";

@Module({
  imports: [
    SessionsModule,
    ParticipantsModule,
    AttemptsModule,
  ],
  controllers: [PublicController],
})
export class PublicModule {}
