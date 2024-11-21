import { ClientsModule, Transport } from '@nestjs/microservices';
import { ODMTaskModule } from './tasks/odm-task.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { CLIENT_PROXY } from '@abd/constants';
import { configuration } from './config';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configuration,
    }),
    ClientsModule.register([{ name: CLIENT_PROXY, transport: Transport.MQTT }]),
    MongooseModule.forRoot('mongodb://localhost/audiobook-downloader'),
    ODMTaskModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
