import { ClientsModule, Transport } from '@nestjs/microservices';
import { EncodeTasksModule } from './tasks/encode-tasks.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { CLIENT_PROXY } from '@abd/constants';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: configuration }),
    ClientsModule.register([{ name: CLIENT_PROXY, transport: Transport.MQTT }]),
    MongooseModule.forRoot('mongodb://localhost/audiobook-downloader'),
    EncodeTasksModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
