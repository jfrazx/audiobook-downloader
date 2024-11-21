import { ActionWatcherInterceptor } from '../interceptors/action-watcher.interceptor';
import { PayloadAssertionService } from '../services/payload-assertion.service';
import { TaskProcessingService } from './task-processing.service';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { CLIENT_PROXY, Message } from '@abd/constants';
import { catchError, mergeMap, of, tap } from 'rxjs';
import { Status, Task, TaskEvent } from '@abd/tasks';
import { Controller, Inject, UseInterceptors } from '@nestjs/common';
import { Topic } from '../constants/topic.enum';
import { Logger } from '@nestjs/common';
import assert from 'node:assert';

@Controller()
export class EncodeTasksController {
  constructor(
    @Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy,
    private readonly taskProcessingService: TaskProcessingService,
    private readonly assertionService: PayloadAssertionService,
  ) {}

  @UseInterceptors(ActionWatcherInterceptor)
  @EventPattern(Message.EncoderProcess)
  taskProcessor(@Payload() task: Task) {
    Logger.log(`Processing task: ${task.topic}`);

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
        Logger.error(error.message);

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
      case Topic.ProcessODM: {
        assert(this.assertionService.validateProcessODMPayload(payload), 'Invalid Process ODM payload');
        return this.taskProcessingService.processODM(task, payload);
      }

      case Topic.Remux: {
        assert(this.assertionService.validateRemuxPayload(payload), 'Invalid Remux payload');
        return this.taskProcessingService.remux(task, payload);
      }

      case Topic.EmbedMetadata: {
        assert(this.assertionService.validateMetadataPayload(payload), 'Invalid audio metadata payload');
        return this.taskProcessingService.embedMetadata(task, payload);
      }

      case Topic.EncodeM4b: {
        break;
      }

      case Topic.EncodeMP3: {
        break;
      }

      case Topic.MergeFiles: {
        break;
      }

      default: {
        throw new Error(`Unknown encode topic: ${task.topic}`);
      }
    }
  }
}
