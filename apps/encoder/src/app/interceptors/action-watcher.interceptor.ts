import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { ClientProxy, MqttContext } from '@nestjs/microservices';
import { CLIENT_PROXY, Message } from '@abd/constants';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { wrapDefaults } from '@status/defaults';
import { Topic } from '../constants/topic.enum';
import { Task, TaskEvent } from '@abd/tasks';
import { merge, Observable, of } from 'rxjs';

@Injectable()
export class ActionWatcherInterceptor implements NestInterceptor {
  private readonly topics: string[] = [Topic.EmbedMetadata, Topic.Remux];

  private readonly actions = wrapDefaults({
    wrap: new Map<string, Map<string, Set<string>>>(),
    defaultValue: () =>
      wrapDefaults({
        wrap: new Map<string, Set<string>>(),
        defaultValue: () => new Set<string>(),
        setUndefined: true,
        execute: true,
      }),
    setUndefined: true,
    execute: true,
  });

  constructor(@Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const [task] = <[Task, MqttContext]>context.getArgs();

    const shouldApply = this.topics.includes(task.topic);
    if (!shouldApply) {
      return next.handle();
    }

    const taskId: string = task._id.toString();
    const parentId: string = task.parent_task_id.toString();

    const actions = <Map<string, Set<string>>>this.actions.get(task.topic);
    const taskIds = <Set<string>>actions.get(parentId);
    taskIds.add(taskId);

    return next
      .handle()
      .pipe(
        mergeMap((response) => this.removeTaskId(parentId, taskId, task.topic).pipe(map(() => response))),
      );
  }

  private removeTaskId(parentId: string, taskId: string, topic: string) {
    const actions = <Map<string, Set<string>>>this.actions.get(topic);
    const taskIds = <Set<string>>actions.get(parentId);
    taskIds.delete(taskId);

    Logger.debug(`${topic} task ID: ${taskId} has completed`);
    Logger.debug(`Remaining ${topic} tasks for parent task ID: ${parentId}: ${taskIds.size}`);

    if (taskIds.size === 0) {
      Logger.debug(`All ${topic} for parent task ID: ${parentId} have completed`);
      this.actions.delete(parentId);

      const topic$ = of(topic);
      const remux$ = topic$.pipe(
        filter((topic) => topic === Topic.Remux),
        mergeMap(() =>
          this.clientProxy.send<Task>(TaskEvent.Update, {
            _id: parentId,
            $set: { 'payload.remux_completed': true },
          }),
        ),
      );
      const metadata$ = topic$.pipe(
        filter((topic) => topic === Topic.EmbedMetadata),
        mergeMap(() =>
          this.clientProxy.send<Task>(TaskEvent.Update, {
            _id: parentId,
            $set: { 'payload.metadata_completed': true },
          }),
        ),
      );

      return merge(remux$, metadata$).pipe(
        mergeMap(() => this.clientProxy.send(TaskEvent.FindOne, { _id: parentId })),
        tap((task) => Logger.debug(`Sending ${task.topic} task ID: ${task._id} to ${task.topic} processor`)),
        mergeMap((task) => this.clientProxy.send(Message.EncoderProcess, task)),
      );
    }

    return of();
  }
}
