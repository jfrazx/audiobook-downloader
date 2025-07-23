import type * as Payloads from '../interfaces/payloads.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PayloadAssertionService {
  validateProcessODMPayload(value: any): value is Payloads.ProcessODM {
    return (
      typeof value?.remux_completed === 'boolean' &&
      typeof value.remux.files_completed === 'number' &&
      typeof value.remux.files_total === 'number' &&
      typeof value?.metadata_completed === 'boolean' &&
      typeof value.metadata.files_completed === 'number' &&
      typeof value.metadata.files_total === 'number' &&
      typeof value.content_directory === 'string' &&
      Array.isArray(value.file_parts) &&
      Array.isArray(value.images)
    );
  }

  validateRemuxPayload(value: any): value is Payloads.Remux {
    return typeof value?.file_path === 'string';
  }

  validateMetadataPayload(value: any): value is Payloads.Metadata {
    return this.validateMP3Metadata(value) && this.validateODMFilePart(value);
  }

  private validateODMFilePart(value: any) {
    return typeof value?.file_part?.file_path === 'string' && this.validatePart(value.file_part.part);
  }

  private validatePart(value: any) {
    return (
      typeof value?.number === 'string' &&
      typeof value.filesize === 'string' &&
      typeof value.duration === 'string'
    );
  }

  private validateMP3Metadata(value: any) {
    return (
      typeof value?.audio_metadata?.title === 'string' &&
      Array.isArray(value.audio_metadata.authors) &&
      Array.isArray(value.audio_metadata.narrators) &&
      typeof value.audio_metadata.description === 'string' &&
      typeof value.audio_metadata.publisher === 'string'
    );
  }
}
