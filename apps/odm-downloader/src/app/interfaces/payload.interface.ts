import type { ODMContent, Part, LicensePaths, License } from '@abd/interfaces';

export interface ReturnAudiobook {
  license: License;
  odm: ODMContent;
}

export interface Cleanup extends ReturnAudiobook {
  target_directory: string;
  license: License;
  odm: ODMContent;
}

export interface File {
  file: Express.Multer.File;
  target_directory: string;
}

export interface ODM extends File {
  odm: ODMContent;
}

export interface LicensePath extends ODM {
  license_paths: LicensePaths;
}

interface WithLicense extends LicensePath {
  license: License;
}

interface WithFilePath {
  file_path?: string;
}

export interface ProcessODM extends WithLicense {
  downloads: {
    audio_files_count: number;
    files_count: number;
    complete: number;
  };
}

export interface FileDownload extends WithLicense, WithFilePath {
  pad: number;
  part: Part;
}

export interface ImageDownload extends ODM, WithFilePath {
  image_url: string;
  type: 'cover' | 'thumbnail';
}

export interface Assemble extends ProcessODM {
  odm: ODMContent;
  license_paths: LicensePaths;
}

export type Downloads = ImageDownload | FileDownload;
