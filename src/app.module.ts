import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './services/redis.service'; // Adjust the import path as needed
import { HttpModule } from '@nestjs/axios';
import { EllucianService } from './ellucian/ellucian.service';
import { EllucianController } from './ellucian/ellucian.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
  ],
  providers: [EllucianService, RedisService], // Register the Redis service
  controllers: [EllucianController],
})
export class AppModule {}
