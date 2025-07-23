import { ClientProxy, EventPattern } from '@nestjs/microservices';
import type * as Payloads from './interfaces/payload.interface';
import { Controller, Inject, Logger } from '@nestjs/common';
import { Task, Status, TaskEvent } from '@abd/tasks';
import { Topic } from './constants/topic.enum';
import { CLIENT_PROXY } from '@abd/constants';
import { map, mergeMap } from 'rxjs/operators';
import { Message } from '@abd/constants';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { from } from 'rxjs';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(@Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy) {}

  @EventPattern(Message.ODMReceived)
  receiveOdmFile(file: Express.Multer.File) {
    this.logger.log(`Received ODM file: ${file.originalname}`);

    const basename = path.join(path.basename(file.originalname, path.extname(file.originalname)));
    const directoryName = basename === 'multipart' ? crypto.randomBytes(16).toString('hex') : basename;
    const targetDirectory = path.join(path.resolve('uploads'), directoryName);

    return from(fs.promises.mkdir(targetDirectory, { recursive: true })).pipe(
      map(
        () =>
          <Task<Payloads.File>>{
            topic: Topic.ParseODM,
            status: Status.Pending,
            payload: {
              target_directory: targetDirectory,
              file,
            },
          },
      ),
      mergeMap((task) => this.clientProxy.send(TaskEvent.Create, task)),
      mergeMap((nextTask) => this.clientProxy.emit(Message.ODMProcess, nextTask)),
    );
  }
}
