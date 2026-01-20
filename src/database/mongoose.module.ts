import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>("MONGODB_URI");
        if (!uri) throw new Error("MONGODB_URI is missing");

        const isProd = config.get<string>("NODE_ENV") === "production";

        return {
          uri,
          // dev-friendly, prod-safe defaults
          autoIndex: !isProd,
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
