import type * as Payloads from '../interfaces/payloads.interface';
import { Injectable } from '@nestjs/common';
import mm from 'music-metadata';

@Injectable()
export class TagsService {
  /**
   * @todo
   */
  async embedMetadata(payload: Payloads.Metadata) {
    const meta = {
      album: payload.audio_metadata.title,
    };
  }
}
