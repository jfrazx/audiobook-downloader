import { ClientProxy, EventPattern } from '@nestjs/microservices';
import type * as Payloads from './interfaces/payloads.interface';
import { CLIENT_PROXY, Message } from '@abd/constants';
import type { EncodeODMMessage } from '@abd/interfaces';
import { Status, Task, TaskEvent } from '@abd/tasks';
import { Controller, Inject } from '@nestjs/common';
import { Topic } from './constants/topic.enum';
import { mergeMap } from 'rxjs/operators';

@Controller()
export class AppController {
  constructor(@Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy) {}

  @EventPattern(Message.EncoderReceivedODM)
  encodeODM(message: EncodeODMMessage) {
    const task: Task<Payloads.ProcessODM> = {
      topic: Topic.ProcessODM,
      status: Status.Pending,
      payload: {
        ...message,
        remux_completed: false,
        metadata_completed: false,
        remux: {
          files_completed: 0,
          files_total: message.file_parts.length,
        },
        metadata: {
          files_completed: 0,
          files_total: message.file_parts.length,
        },
      },
    };

    return this.clientProxy
      .send<Task>(TaskEvent.Create, task)
      .pipe(mergeMap((nextTask) => this.clientProxy.emit(Message.EncoderProcess, nextTask)));
  }
}
