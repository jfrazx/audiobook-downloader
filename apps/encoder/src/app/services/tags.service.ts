import { Injectable } from '@nestjs/common';
import mm from 'music-metadata';

@Injectable()
export class TagsService {
  /**
   * @todo
   */
  embedMetadata(filePath: string, metadata: any) {
    return mm;
  }
}
