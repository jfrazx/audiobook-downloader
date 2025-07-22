import { DownloadWatcherInterceptor } from './interceptors/download-watcher.interceptor';
import { PayloadAssertionService } from '../services/payload-assertion.service';
import { ConcurrencyInterceptor } from './interceptors/concurrency.interceptor';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { Controller, Inject, Logger, UseInterceptors } from '@nestjs/common';
import { TaskProcessingService } from './task-processing.service';
import { mergeMap, tap, catchError } from 'rxjs/operators';
import { Status, type Task, TaskEvent } from '@abd/tasks';
import { CLIENT_PROXY, Message } from '@abd/constants';
import { Topic } from '../constants/topic.enum';
import assert from 'node:assert';
import { of } from 'rxjs';

@Controller()
export class ODMTaskController {
  private readonly logger = new Logger(ODMTaskController.name);

  constructor(
    @Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy,
    private readonly taskProcessingService: TaskProcessingService,
    private readonly odmAssertionService: PayloadAssertionService,
  ) {}

  @UseInterceptors(DownloadWatcherInterceptor, ConcurrencyInterceptor)
  @EventPattern(Message.ODMProcess)
  taskProcessor(@Payload() task: Task) {
    this.logger.log(`Processing task: ${task.topic}`);

    return of(task).pipe(
      tap((task) => {
        assert(task.status !== Status.Completed, 'Task is already completed');
        assert(task.status !== Status.Failed, 'Task is already failed');
        assert(task._id, 'Task ID must be provided');
      }),
      mergeMap((task) =>
        this.clientProxy.send<Task, Partial<Task>>(TaskEvent.Update, {
          status: Status.InProgress,
          _id: task._id,
        }),
      ),
      mergeMap((task) => this.taskAssignment(task)),
      catchError((error) => {
        this.logger.error(error.message);

        return this.clientProxy.emit<Task>(TaskEvent.Update, {
          status: Status.Failed,
          _id: task._id,
          error: {
            message: error.message,
            stack: error.stack,
          },
        });
      }),
    );
  }

  private taskAssignment(task: Task) {
    const payload = task.payload;

    switch (task.topic) {
      case Topic.ParseODM: {
        assert(this.odmAssertionService.validateFilePayload(payload), 'Invalid file payload');
        return this.taskProcessingService.parseODM(task, payload);
      }

      case Topic.DownloadLicense: {
        assert(this.odmAssertionService.validateODMPayload(payload), 'Invalid ODM payload');
        return this.taskProcessingService.downloadLicense(task, payload);
      }

      case Topic.ParseLicense: {
        assert(this.odmAssertionService.validateLicensePathsPayload(payload), 'Invalid License payload');
        return this.taskProcessingService.parseLicense(task, payload);
      }

      case Topic.ProcessODM: {
        assert(this.odmAssertionService.validateProcessODMPayload(payload), 'Invalid Process ODM payload');
        return this.taskProcessingService.processODM(task, payload);
      }

      case Topic.DownloadImage: {
        assert(
          this.odmAssertionService.validateImageDownloadPayload(payload),
          'Invalid Image Download payload',
        );
        return this.taskProcessingService.downloadImage(task, payload);
      }

      case Topic.DownloadFile: {
        assert(
          this.odmAssertionService.validateFileDownloadPayload(payload),
          'Invalid File Download payload',
        );
        return this.taskProcessingService.downloadFile(task, payload);
      }

      case Topic.Assemble: {
        assert(this.odmAssertionService.validateAssemblePayload(payload), 'Invalid Assemble payload');
        return this.taskProcessingService.assemble(task, payload);
      }

      case Topic.Cleanup: {
        assert(this.odmAssertionService.validateCleanupPayload(payload), 'Invalid Cleanup payload');
        return this.taskProcessingService.cleanup(task, payload);
      }

      default: {
        throw new Error(`Unknown odm topic: ${task.topic}`);
      }
    }
  }
}
