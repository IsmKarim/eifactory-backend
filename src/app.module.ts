import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './config/env.schema';
import { DatabaseModule } from './database/mongoose.module';
import { SessionsModule } from './modules/session/session.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: envSchema,
    cache: true,
  }),
    DatabaseModule, SessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
