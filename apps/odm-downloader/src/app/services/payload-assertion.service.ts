import type * as Payloads from '../interfaces/payload.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PayloadAssertionService {
  validateCleanupPayload(value: any): value is Payloads.Cleanup {
    return this.validateTargetDirectory(value) && this.validateODM(value) && this.validateLicense(value);
  }

  private validateTargetDirectory(value: any) {
    return typeof value?.target_directory === 'string';
  }

  validateFilePayload(value: any): value is Payloads.File {
    return this.validateTargetDirectory(value) && this.validateFile(value);
  }

  private validateFile(value: any) {
    return (
      typeof value?.file?.filename === 'string' &&
      typeof value.file.originalname === 'string' &&
      typeof value.file.buffer !== 'undefined' &&
      value.file.buffer !== null
    );
  }

  validateODMPayload(value: any): value is Payloads.ODM {
    return this.validateODM(value) && this.validateFilePayload(value);
  }

  private validateODM(value: any) {
    return (
      typeof value?.odm?.OverDriveMedia?.License === 'object' &&
      typeof value.odm.OverDriveMedia.Metadata?.Title === 'string' &&
      Array.isArray(value.odm.OverDriveMedia.Formats?.Format?.Parts.Part)
    );
  }

  validateLicensePathsPayload(value: any): value is Payloads.LicensePath {
    return typeof value?.license_paths?.file_contents === 'string' && this.validateODMPayload(value);
  }

  validateProcessODMPayload(value: any): value is Payloads.ProcessODM {
    return (
      this.validateODM(value) &&
      typeof value.downloads?.audio_files_count === 'number' &&
      typeof value.downloads.files_count === 'number' &&
      typeof value.downloads.complete === 'number' &&
      this.validateLicensePathsPayload(value)
    );
  }

  private validateLicense(value: any) {
    return (
      typeof value?.License?.SignedInfo?.ClientID === 'string' && typeof value.License.Signature === 'string'
    );
  }

  validateFileDownloadPayload(value: any): value is Payloads.FileDownload {
    return (
      typeof value?.part?.filename === 'string' &&
      typeof value.part.name === 'string' &&
      typeof value.part.number === 'string' &&
      typeof value.pad === 'number' &&
      this.validateLicensePathsPayload(value)
    );
  }

  validateImageDownloadPayload(value: any): value is Payloads.ImageDownload {
    return (
      typeof value.image_url === 'string' && typeof value.type === 'string' && this.validateODMPayload(value)
    );
  }

  validateAssemblePayload(value: any): value is Payloads.Assemble {
    return (
      this.validateODM(value) &&
      this.validateTargetDirectory(value) &&
      typeof value.license_paths?.file_contents === 'string'
    );
  }
}
