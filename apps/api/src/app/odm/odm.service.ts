import { Message, CLIENT_PROXY } from '@abd/constants';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { map, mergeMap } from 'rxjs/operators';
import { XMLValidator } from 'fast-xml-parser';
import * as fs from 'node:fs';
import { from } from 'rxjs';

@Injectable()
export class OdmService {
  constructor(@Inject(CLIENT_PROXY) private readonly clientProxy: ClientProxy) {}

  async validate(file: Express.Multer.File): Promise<boolean> {
    const isODMExtension = file.originalname.endsWith('.odm');
    if (!isODMExtension) {
      return isODMExtension;
    }

    const content = await fs.promises.readFile(file.path, 'utf-8');

    Logger.log('Validating ODM file:', file.originalname);
    return XMLValidator.validate(content) === isODMExtension;
  }

  sendMessage(file: Express.Multer.File) {
    Logger.log(`Sending ODM file: ${file.originalname}`);

    return from(fs.promises.readFile(file.path)).pipe(
      map((buffer: Buffer) => ({ ...file, buffer })),
      mergeMap((file) => this.clientProxy.emit(Message.ODMReceived, file)),
      mergeMap(() => fs.promises.unlink(file.path)),
    );
  }
}
