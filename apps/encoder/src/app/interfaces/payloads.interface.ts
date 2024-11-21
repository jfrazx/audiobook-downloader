import type { EncodeODMMessage, ODMFilePart, MP3Metadata } from '@abd/interfaces';

export interface ProcessODM extends EncodeODMMessage {
  remux_completed: boolean;
  remux: {
    files_completed: number;
    files_total: number;
  };

  metadata_completed: boolean;
  metadata: {
    files_completed: number;
    files_total: number;
  };
}

export interface Metadata {
  audio_metadata: MP3Metadata;
  file_part: ODMFilePart;
}

export interface Remux {
  file_path: string;
}
