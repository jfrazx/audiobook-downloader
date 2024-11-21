import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { PayloadAssertionService } from '../../services/payload-assertion.service';
import type { ClientProxy, MqttContext } from '@nestjs/microservices';
import type * as Payloads from '../../interfaces/payload.interface';
import { filter, mergeMap, map, tap } from 'rxjs/operators';
import { Message, CLIENT_PROXY } from '@abd/constants';
import { Topic } from '../../constants/topic.enum';
import { wrapDefaults } from '@status/defaults';
import { Task, TaskEvent } from '@abd/tasks';
import { Observable, of } from 'rxjs';

@Injectable()
export class DownloadWatcherInterceptor implements NestInterceptor {
  private readonly topics: string[] = [Topic.DownloadFile, Topic.DownloadImage];

  private readonly downloads = wrapDefaults({
    wrap: new Map<string, Set<string>>(),
    defaultValue: () => new Set<string>(),
    setUndefined: true,
    execute: true,
  });

  constructor(
    @Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy,
    private readonly odmAssertionService: PayloadAssertionService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const [task] = <[Task, MqttContext]>context.getArgs();

    const shouldApply = this.topics.includes(task.topic);
    if (!shouldApply) {
      return next.handle();
    }

    const taskId: string = task._id.toString();
    const parentId: string = task.parent_task_id.toString();

    const taskIds = <Set<string>>this.downloads.get(parentId);
    taskIds.add(taskId);

    return next
      .handle()
      .pipe(mergeMap((response) => this.removeTaskId(parentId, taskId).pipe(map(() => response))));
  }

  private removeTaskId(parentId: string, taskId: string) {
    const taskIds = <Set<string>>this.downloads.get(parentId);
    taskIds.delete(taskId);

    Logger.debug(`Download task ID: ${taskId} has completed`);
    Logger.debug(`Remaining download tasks for parent task ID: ${parentId}: ${taskIds.size}`);

    if (taskIds.size === 0) {
      Logger.debug(`All downloads for parent task ID: ${parentId} have completed`);
      this.downloads.delete(parentId);

      return this.clientProxy.send<Task<Payloads.ProcessODM>>(TaskEvent.FindOne, { _id: parentId }).pipe(
        tap((task) =>
          Logger.debug(
            `Task ${task._id} has downloaded ${task.payload.downloads.complete} files of ${task.payload.downloads.files_count}`,
          ),
        ),
        filter((task) => this.odmAssertionService.validateProcessODMPayload(task.payload)),
        filter((task) => task.payload.downloads.files_count === task.payload.downloads.complete),
        mergeMap((task) => this.clientProxy.send<Task>(Message.ODMProcess, task)),
      );
    }

    return of();
  }
}
