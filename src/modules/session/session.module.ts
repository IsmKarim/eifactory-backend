import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SessionsController } from "./session.controller";
import { SessionsService } from "./session.service";
import { Session, SessionSchema } from "./session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
