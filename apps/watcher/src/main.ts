import { WatcherModule } from './app/watcher.module';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  await NestFactory.create(WatcherModule);
  Logger.log(`🚀 Watcher is running`);
}

bootstrap();
