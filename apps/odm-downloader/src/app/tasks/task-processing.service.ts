import type { Part, EncodeODMMessage, ODMFilePart, ODMImagePart } from '@abd/interfaces';
import { map, mergeMap, filter, tap, groupBy, toArray } from 'rxjs/operators';
import type { ODMCleanupConfig, ODMReturnsConfig } from '@abd/config';
import { Status, TaskDocument, TaskEvent, Task } from '@abd/tasks';
import { from, Observable, of, merge, combineLatest } from 'rxjs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Payloads from '../interfaces/payload.interface';
import type { ObjectId, RootFilterQuery } from 'mongoose';
import { CLIENT_PROXY, Message } from '@abd/constants';
import { OdmService } from '../services/odm.service';
import { ClientProxy } from '@nestjs/microservices';
import { Topic } from '../constants/topic.enum';
import { ConfigService } from '@nestjs/config';
import assert from 'node:assert';

@Injectable()
export class TaskProcessingService {
  private readonly logger = new Logger(TaskProcessingService.name);

  constructor(
    @Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy,
    private readonly configService: ConfigService,
    private readonly odmService: OdmService,
  ) {}

  assemble(task: Task, payload: Payloads.Assemble) {
    assert(task.parent_task_id, 'Parent task ID must be provided');
    this.logger.log(`Assembling task ${task._id} with ${payload.downloads.files_count} files`);

    const grouped$ = this.clientProxy
      .send<Task<Payloads.Downloads>[], RootFilterQuery<Task>>(TaskEvent.FindAll, {
        $and: [
          {
            parent_task_id: task.parent_task_id,
            $or: [{ topic: Topic.DownloadFile }, { topic: Topic.DownloadImage }],
          },
        ],
      })
      .pipe(
        tap((tasks) => assert(tasks.length, `No child tasks found for task ${task.parent_task_id} `)),
        tap((tasks) => assert(tasks.length === payload.downloads.files_count, 'Child tasks count mismatch')),
        tap((tasks) => this.logger.log(`Found ${tasks.length} child tasks for task ${task.parent_task_id}`)),
        mergeMap((tasks) => from(tasks)),
        groupBy((task) => task.topic),
      );

    const fileParts$ = grouped$.pipe(
      filter((group) => group.key === Topic.DownloadFile),
      mergeMap((group) =>
        group.pipe(
          map<Task<Payloads.FileDownload>, ODMFilePart>((task) => ({
            total_parts: payload.downloads.audio_files_count,
            part: task.payload.part,
            file_path: task.payload.file_path,
          })),
        ),
      ),
      toArray(),
    );
    const imageParts$ = grouped$.pipe(
      filter((group) => group.key === Topic.DownloadImage),
      mergeMap((group) =>
        group.pipe(
          map<Task<Payloads.ImageDownload>, ODMImagePart>((task) => ({
            type: task.payload.type,
            file_path: task.payload.file_path,
          })),
        ),
      ),
      toArray(),
    );

    return combineLatest([fileParts$, imageParts$]).pipe(
      map(([fileParts, imageParts]) => {
        const metadata = this.odmService.extractMP3Metadata(payload.odm);

        const encodeMessage: EncodeODMMessage = {
          audio_metadata: metadata,
          content_directory: payload.target_directory,
          file_parts: fileParts,
          images: imageParts,
          license: payload.license,
        };

        return encodeMessage;
      }),
      mergeMap((message) => this.clientProxy.emit(Message.EncoderReceivedODM, message)),
      mergeMap(() =>
        this.clientProxy.emit(TaskEvent.Update, {
          _id: task._id,
          status: Status.Completed,
          completed_at: new Date(),
        }),
      ),
    );
  }

  cleanup(task: Task, payload: Payloads.Cleanup) {
    this.logger.log(`Cleaning up task ${task._id}`);

    const cleanup = this.configService.get<ODMCleanupConfig>('cleanup');
    const returns = this.configService.get<ODMReturnsConfig>('returns');

    const observables: Observable<any>[] = [];

    if (cleanup.directory) {
      const observable = from(this.odmService.cleanup(payload.target_directory));
      observables.push(observable);
    }

    if (cleanup.db) {
      const observable = this.clientProxy.emit(TaskEvent.RemoveMany, {
        'payload.target_directory': payload.target_directory,
      });
      observables.push(observable);
    }

    if (returns.audiobook) {
      const returnTask: Task<Payloads.ReturnAudiobook> = {
        topic: Topic.ReturnAudiobook,
        status: Status.Pending,
        payload: {
          license: payload.license,
          odm: payload.odm,
        },
        parent_task_id: task._id,
      };

      const observable = this.clientProxy
        .send<Task>(TaskEvent.Create, returnTask)
        .pipe(mergeMap((nextTask) => this.clientProxy.emit(Message.ODMProcess, nextTask)));

      observables.push(observable);
    }

    return from(observables).pipe(mergeMap((observable) => observable));
  }

  downloadLicense(task: Task, payload: Payloads.ODM) {
    return from(this.odmService.downloadLicense(payload)).pipe(
      map((licensePaths) => ({
        topic: Topic.ParseLicense,
        status: Status.Pending,
        payload: {
          ...payload,
          license_paths: licensePaths,
        },
        parent_task_id: task._id,
      })),
      mergeMap((parseLicenseTask) => this.sendComplete(parseLicenseTask)),
    );
  }

  parseLicense(task: Task, payload: Payloads.LicensePath) {
    const license = this.odmService.parseLicense(payload.license_paths.file_contents);
    const audioFilesCount = payload.odm.OverDriveMedia.Formats.Format.Parts.Part.length;

    const processODMTask: Task<Payloads.ProcessODM> = {
      topic: Topic.ProcessODM,
      status: Status.Pending,
      payload: {
        ...payload,
        license,
        downloads: {
          audio_files_count: audioFilesCount,
          // plus 2 is for cover and thumbnail
          // TODO: ensure that cover and thumbnail are always presents
          files_count: audioFilesCount + 2,
          complete: 0,
        },
      },
      parent_task_id: task._id,
    };

    return this.sendComplete(processODMTask);
  }

  parseODM(task: Task, payload: Payloads.File) {
    const odm = this.odmService.parseODM(payload.file.buffer);
    const licenseTask: Task<Payloads.ODM> = {
      topic: Topic.DownloadLicense,
      status: Status.Pending,
      payload: {
        ...payload,
        odm,
      },
      parent_task_id: task._id,
    };

    return this.sendComplete(licenseTask);
  }

  processODM(task: Task, payload: Payloads.ProcessODM) {
    if (payload.downloads.complete > 0) {
      return this.processODMCompletions(task, payload);
    }

    const coverTask: Task<Payloads.ImageDownload> = {
      topic: Topic.DownloadImage,
      status: Status.Pending,
      payload: {
        type: 'cover',
        odm: payload.odm,
        file: payload.file,
        target_directory: payload.target_directory,
        image_url: payload.odm.OverDriveMedia.Metadata.CoverUrl,
      },
      parent_task_id: task._id,
    };

    const thumbnailTask: Task<Payloads.ImageDownload> = {
      topic: Topic.DownloadImage,
      status: Status.Pending,
      payload: {
        type: 'thumbnail',
        odm: payload.odm,
        file: payload.file,
        target_directory: payload.target_directory,
        image_url: payload.odm.OverDriveMedia.Metadata.ThumbnailUrl,
      },
      parent_task_id: task._id,
    };

    type Downloads = Payloads.ImageDownload | Payloads.FileDownload;

    const parts = payload.odm.OverDriveMedia.Formats.Format.Parts.Part;
    const pad = parts.length < 10 ? 2 : parts.length.toString().length;

    const tasks = parts.reduce(
      (tasks: Task<Downloads>[], part: Part) => [
        ...tasks,
        <Task<Payloads.FileDownload>>{
          topic: Topic.DownloadFile,
          parent_task_id: task._id,
          status: Status.Pending,
          payload: {
            pad,
            part,
            odm: payload.odm,
            file: payload.file,
            license: payload.license,
            license_paths: payload.license_paths,
            target_directory: payload.target_directory,
          },
        },
      ],
      [coverTask, thumbnailTask],
    );

    this.logger.log(`Creating ${tasks.length} child tasks for task ${task._id}`);

    return this.sendChildTasks(tasks, task._id);
  }

  private processODMCompletions(task: Task, payload: Payloads.ProcessODM) {
    const completePipe = (payload$: Observable<Payloads.ProcessODM>) => {
      return payload$.pipe(
        filter((payload) => payload.downloads.complete === payload.downloads.files_count),
        map<Payloads.ProcessODM, Task<Payloads.Assemble>>((payload) => ({
          topic: Topic.Assemble,
          status: Status.Pending,
          payload: {
            ...payload,
          },
          parent_task_id: task._id,
        })),
        mergeMap((assembleTask) => this.sendComplete(assembleTask)),
      );
    };

    const payload$ = of(payload);
    const downloadsComplete$ = completePipe(payload$);
    const downloadsIncomplete$ = payload$.pipe(
      filter((payload) => payload.downloads.complete !== payload.downloads.files_count),
      mergeMap(() => this.clientProxy.send<Task[]>(TaskEvent.FindAll, { parent_task_id: task._id })),
      tap((childTasks) => {
        assert(childTasks.length, `No child tasks found for task ${task._id}`);
        assert(childTasks.length === payload.downloads.files_count, 'Child tasks count mismatch');
      }),
      map((childTasks) => childTasks.filter((childTask) => childTask.status !== Status.Completed)),
    );

    const hasIncompleteTasks$ = downloadsIncomplete$.pipe(
      filter((incompleteTasks) => incompleteTasks.length > 0),
      mergeMap((incompleteTasks) => from(incompleteTasks)),
      mergeMap((incompleteTask) => this.clientProxy.emit(Message.ODMProcess, incompleteTask)),
    );

    const hasNoIncompleteTasks$ = downloadsIncomplete$.pipe(
      filter((incompleteTasks) => incompleteTasks.length === 0),
      mergeMap(() =>
        this.clientProxy.emit(TaskEvent.Update, {
          _id: task._id,
          status: Status.Completed,
          completed_at: new Date(),
          $set: { 'payload.downloads.complete': payload.downloads.files_count },
        }),
      ),
      map(() =>
        payload$.pipe(
          map((payload) => ({
            ...payload,
            downloads: {
              ...payload.downloads,
              complete: payload.downloads.files_count,
            },
          })),
        ),
      ),
      mergeMap((payload$) => completePipe(payload$)),
    );

    return merge(downloadsComplete$, hasIncompleteTasks$, hasNoIncompleteTasks$);
  }

  downloadImage(task: Task, payload: Payloads.ImageDownload) {
    return from(this.odmService.downloadImage(payload)).pipe(
      mergeMap((imagePath) => this.downloader(task, imagePath)),
    );
  }

  downloadFile(task: Task, payload: Payloads.FileDownload) {
    return from(this.odmService.downloadFile(payload)).pipe(
      mergeMap((filePath) => this.downloader(task, filePath)),
    );
  }

  private downloader(task: Task, filePath: string) {
    assert(task.parent_task_id, 'Parent task ID must be provided');

    this.logger.log(`Downloaded file ${filePath}`);

    return this.clientProxy
      .emit(TaskEvent.Update, {
        _id: task.parent_task_id,
        $inc: { 'payload.downloads.complete': 1 },
      })
      .pipe(
        tap(() => this.logger.log(`Incremented download count for task ${task.parent_task_id}`)),
        mergeMap(() =>
          this.clientProxy.send(TaskEvent.Update, {
            _id: task._id,
            status: Status.Completed,
            completed_at: new Date(),
            $set: { 'payload.file_path': filePath },
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
        ).pipe(mergeMap(() => this.clientProxy.emit(Message.ODMProcess, nextTask))),
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
        tap((tasks) => this.logger.log(`Created ${tasks.length} child tasks for task ${parentId}`)),
        mergeMap((tasks) => from(tasks)),
        mergeMap((task) => this.clientProxy.emit(Message.ODMProcess, task)),
      );
  }
}
