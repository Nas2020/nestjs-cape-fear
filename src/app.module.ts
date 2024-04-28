import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  providers: [EllucianService],
  controllers: [EllucianController],
})
export class AppModule {}
