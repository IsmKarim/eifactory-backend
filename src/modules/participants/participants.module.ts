import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ParticipantsController } from "./participants.controller";
import { ParticipantsService } from "./participants.service";
import { Participant, ParticipantSchema } from "./schemas/participant.schema";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Participant.name, schema: ParticipantSchema }]),
    EventsModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
