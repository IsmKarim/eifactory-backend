import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ParticipantsController } from "./participants.controller";
import { ParticipantsService } from "./participants.service";
import { Participant, ParticipantSchema } from "./schemas/participant.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Participant.name, schema: ParticipantSchema }]),
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
