import { ConfigModule } from '@nestjs/config';
import { OdmModule } from './odm/odm.module';
import { configuration } from './config';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
    }),
    OdmModule,
  ],
})
export class AppModule {}
