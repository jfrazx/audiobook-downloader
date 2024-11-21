import { ActionWatcherInterceptor } from '../interceptors/action-watcher.interceptor';
import { PayloadAssertionService } from '../services/payload-assertion.service';
import { TaskProcessingService } from './task-processing.service';
import { EncodeTasksController } from './encode-tasks.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FfmpegService } from '../services/ffmpeg.service';
import { TagsService } from '../services/tags.service';
import { CLIENT_PROXY } from '@abd/constants';
import { Module } from '@nestjs/common';

@Module({
  providers: [
    ActionWatcherInterceptor,
    PayloadAssertionService,
    TaskProcessingService,
    FfmpegService,
    TagsService,
  ],
  imports: [ClientsModule.register([{ name: CLIENT_PROXY, transport: Transport.MQTT }])],
  controllers: [EncodeTasksController],
})
export class EncodeTasksModule {}
