import { DownloadWatcherInterceptor } from './interceptors/download-watcher.interceptor';
import { ConcurrencyInterceptor } from './interceptors/concurrency.interceptor';
import { PayloadAssertionService } from '../services/payload-assertion.service';
import { TaskProcessingService } from './task-processing.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ODMTaskController } from './odm-task.controller';
import { OdmService } from '../services/odm.service';
import { CLIENT_PROXY } from '@abd/constants';
import { Module } from '@nestjs/common';

@Module({
  imports: [ClientsModule.register([{ name: CLIENT_PROXY, transport: Transport.MQTT }])],
  controllers: [ODMTaskController],
  providers: [
    TaskProcessingService,
    ConcurrencyInterceptor,
    DownloadWatcherInterceptor,
    PayloadAssertionService,
    OdmService,
  ],
  exports: [],
})
export class ODMTaskModule {}
