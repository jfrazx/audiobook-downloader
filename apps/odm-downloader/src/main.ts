import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import 'multer';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.MQTT,
    options: {
      url: 'mqtt://localhost:1883',
    },
  });

  await app.listen();
  Logger.log(`🚀 ODM downloader is running`);
}

bootstrap();
