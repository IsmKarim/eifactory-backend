import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.schema';
import { DatabaseModule } from './database/mongoose.module';
import { SessionsModule } from './modules/session/session.module';
import {AdminAuthModule} from './modules/admin-auth/admin-auth.module'
import { ParticipantsModule } from './modules/participants/participants.module';
import { PublicModule } from './modules/public/public.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { QuestionsModule } from './modules/questions/questions.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: envSchema,
    cache: true,
  }),
    DatabaseModule, SessionsModule , AdminAuthModule , ParticipantsModule , PublicModule , AttemptsModule , QuestionsModule],
  controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
