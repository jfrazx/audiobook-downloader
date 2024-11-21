import { WatcherController } from './watcher.controller';
import { WatcherService } from './watcher.service';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configuration,
    }),
  ],
  controllers: [WatcherController],
  providers: [WatcherService],
})
export class WatcherModule {}
