import type { License } from './license.interface';
import type { MP3Metadata } from './metadata.interface';
import type { Part } from './odm.interface';

export interface EncodeODMMessage {
  audio_metadata: MP3Metadata;
  content_directory: string;
  file_parts: ODMFilePart[];
  images: ODMImagePart[];
  license: License;
}

export interface ODMImagePart {
  file_path: string;
  type: 'cover' | 'thumbnail';
}

export interface ODMFilePart {
  file_path: string;
  part: Part;
}
