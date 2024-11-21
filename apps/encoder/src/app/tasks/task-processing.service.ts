import { Status, TaskDocument, TaskEvent, Task } from '@abd/tasks';
import type * as Payloads from '../interfaces/payloads.interface';
import { CLIENT_PROXY, Message } from '@abd/constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FfmpegService } from '../services/ffmpeg.service';
import { Topic } from '../constants/topic.enum';
import { from, mergeMap, of } from 'rxjs';
import { ObjectId } from 'mongoose';
import assert from 'node:assert';

@Injectable()
export class TaskProcessingService {
  constructor(
    @Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy,
    private readonly ffmpegService: FfmpegService,
  ) {}

  /**
   * Orchestrates the processing of an ODM file.
   */
  processODM(task: Task, payload: Payloads.ProcessODM) {
    if (!payload.remux_completed) {
      // TODO: determine if a previous failure occurred and cleanup is necessary
      return this.spawnRemuxTasks(task, payload);
    }

    if (!payload.metadata_completed) {
      return this.spawnMetadataTasks(task, payload);
    }
  }

  private spawnMetadataTasks(task: Task, payload: Payloads.ProcessODM) {
    const tasks = payload.file_parts.map<Task<Payloads.Metadata>>((filePart) => {
      return {
        topic: Topic.EmbedMetadata,
        status: Status.Pending,
        payload: {
          audio_metadata: payload.audio_metadata,
          file_part: filePart,
        },
        parent_task_id: task._id,
      };
    });

    return this.sendChildTasks(tasks, task._id);
  }

  /**
   * @todo
   */
  embedMetadata(task: Task, payload: Payloads.Metadata) {
    return of();
  }

  private spawnRemuxTasks(task: Task, payload: Payloads.ProcessODM) {
    const tasks = payload.file_parts.map<Task<Payloads.Remux>>((filePart) => {
      return {
        topic: Topic.Remux,
        status: Status.Pending,
        payload: {
          file_path: filePart.file_path,
        },
        parent_task_id: task._id,
      };
    });

    return this.sendChildTasks(tasks, task._id);
  }

  remux(task: Task, payload: Payloads.Remux) {
    return from(this.ffmpegService.remux(payload.file_path)).pipe(
      mergeMap(() =>
        this.clientProxy.emit(TaskEvent.Update, {
          _id: task.parent_task_id,
          $inc: { 'payload.remux.files_completed': 1 },
        }),
      ),
      mergeMap(() =>
        this.clientProxy.emit(TaskEvent.Update, {
          _id: task._id,
          status: Status.Completed,
          completed_at: new Date(),
        }),
      ),
    );
  }

  private sendComplete<T>(task: Task<T>) {
    assert(task.parent_task_id, 'Parent task ID must be provided');

    return this.clientProxy.send(TaskEvent.Create, task).pipe(
      mergeMap((nextTask) =>
        from(
          this.clientProxy.emit(TaskEvent.Update, {
            _id: task.parent_task_id,
            status: Status.Completed,
            completed_at: new Date(),
          }),
        ).pipe(mergeMap(() => this.clientProxy.emit(Message.EncoderProcess, nextTask))),
      ),
    );
  }

  private sendChildTasks<T>(tasks: Task<T>[], parentId: ObjectId) {
    return this.clientProxy
      .emit(TaskEvent.Update, {
        _id: parentId,
        status: Status.ChildPending,
      })
      .pipe(
        mergeMap(() => this.clientProxy.send<TaskDocument[]>(TaskEvent.CreateMany, tasks)),
        mergeMap((tasks) => from(tasks)),
        mergeMap((task) => this.clientProxy.emit(Message.EncoderProcess, task)),
      );
  }
}
