import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { concatMap, filter, take, mergeMap, tap } from 'rxjs/operators';
import { merge, Observable, of, Subject } from 'rxjs';
import { MqttContext } from '@nestjs/microservices';
import { Topic } from '../../constants/topic.enum';
import { wrapDefaults } from '@status/defaults';
import { ConfigService } from '@nestjs/config';
import { Task, Status } from '@abd/tasks';

interface ConcurrencyGroup {
  subject: Subject<Task>;
  status: Status;
  task: Task;
}

@Injectable()
export class ConcurrencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ConcurrencyInterceptor.name);
  private readonly concurrent = wrapDefaults({
    wrap: new Map<string, Map<string, ConcurrencyGroup>>(),
    defaultValue: () => new Map<string, ConcurrencyGroup>(),
    setUndefined: true,
    execute: true,
  });

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Task> {
    const [task] = <[Task, MqttContext]>context.getArgs();

    if (task.topic !== Topic.DownloadFile) {
      this.logger.debug(`${task.topic} is not a file download task, skipping concurrency`);
      return next.handle();
    }

    const taskId: string = task._id.toString();
    const parentId: string = task.parent_task_id.toString();
    const filesConcurrency: number = this.configService.get<number>('odm.concurrency.book_files');

    const group = <Map<string, ConcurrencyGroup>>this.concurrent.get(parentId);
    const subject = new Subject<Task>();

    const shouldWait = group.size >= filesConcurrency;
    const concurrencyGroup: ConcurrencyGroup = {
      status: shouldWait ? Status.Pending : Status.InProgress,
      subject,
      task,
    };

    this.logger.log(
      `Concurrency group for parent task: ${parentId} has ${group.size} tasks and ${filesConcurrency} allowed concurrency and should wait: ${shouldWait}`,
    );

    group.set(taskId, concurrencyGroup);

    if (!shouldWait) {
      this.logger.debug(`Skipping concurrency for task: ${task.topic} with ID: ${task._id}`);

      return next.handle().pipe(
        tap(() => this.logger.debug(`Task: ${task.topic} with ID: ${task._id} completed`)),
        tap(() => this.nextHandler(parentId, taskId)),
      );
    }

    this.logger.debug(`Applying concurrency for task: ${task.topic} with ID: ${task._id}`);

    return subject.pipe(
      tap(() => this.logger.debug(`Resuming task: ${task.topic} with ID: ${task._id}`)),
      mergeMap(() => next.handle()),
      tap(() => this.logger.debug(`Task: ${task.topic} with ID: ${task._id} completed`)),
      tap(() => this.nextHandler(parentId, taskId)),
    );

    const shouldWait$ = of(shouldWait);
    const apply = shouldWait$.pipe(
      filter((wait) => wait),
      tap(() => this.logger.debug(`Applying concurrency for task: ${task.topic} with ID: ${task._id}`)),
      mergeMap(() => subject),
      take(1),
      tap(() => this.logger.debug(`Resuming task: ${task.topic} with ID: ${task._id}`)),
    );

    const skip = shouldWait$.pipe(
      filter((apply) => !apply),
      tap(() => this.logger.debug(`Skipping concurrency for task: ${task.topic} with ID: ${task._id}`)),
    );

    return merge(skip, apply).pipe(
      concatMap(() => next.handle()),
      tap(() => this.logger.debug(`Task: ${task.topic} with ID: ${task._id} completed`)),
      tap(() => this.nextHandler(parentId, taskId)),
    );
  }

  private nextHandler(parentId: string, taskId: string) {
    const group = <Map<string, ConcurrencyGroup>>this.concurrent.get(parentId);

    group.delete(taskId);

    const pendingTasks = Array.from(group.values()).filter((next) => next.status === Status.Pending);
    const tasksInProgress = group.size - pendingTasks.length;
    const availableConcurrency =
      this.configService.get<number>('odm.concurrency.book_files') - tasksInProgress;

    const neededConcurrency = Math.min(pendingTasks.length, availableConcurrency);

    this.logger.debug(
      `Available concurrency for parent task: ${parentId} is: ${availableConcurrency} and needed concurrency is: ${neededConcurrency}`,
    );
    this.logger.debug(
      `Parent task: ${parentId} has ${tasksInProgress} tasks in progress and ${pendingTasks.length} pending tasks`,
    );

    for (let i = 0; i < neededConcurrency; i++) {
      const nextGroup = pendingTasks[i];
      this.logger.debug(`Processing next task: ${nextGroup.task.topic} with ID: ${nextGroup.task._id}`);
      nextGroup.status = Status.InProgress;
      nextGroup.subject.next(nextGroup.task);
    }

    if (group.size === 0) {
      this.logger.debug(`Deleting concurrency group for parent task: ${parentId}`);
      this.concurrent.delete(parentId);
    }
  }
}
