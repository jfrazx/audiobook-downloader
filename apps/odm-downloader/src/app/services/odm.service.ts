import type { Metadata, ODMContent, License, LicensePaths, MP3Metadata } from '@abd/interfaces';
import type * as Payloads from '../interfaces/payload.interface';
import { Injectable, Logger } from '@nestjs/common';
import { wrapDefaults } from '@status/defaults';
import { XMLParser } from 'fast-xml-parser';
import { asArray } from '@jfrazx/asarray';
import * as crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { ODM } from '@abd/constants';
import { v1 as uuidV1 } from 'uuid';
import * as utils from '@abd/utils';
import * as path from 'node:path';
import assert from 'node:assert';
import { URL } from 'node:url';
import * as fs from 'node:fs';
import * as TimerPromises from 'node:timers/promises';

@Injectable()
export class OdmService {
  async cleanup(targetDirectory: string) {
    return utils.recursivelyDeleteDirectoryContents(targetDirectory);
  }

  async downloadLicense(payload: Payloads.ODM): Promise<LicensePaths> {
    const basename = path.basename(payload.file.originalname, path.extname(payload.file.originalname));
    const fileName = `${basename}.license`;

    const filePath = path.join(payload.target_directory, fileName);

    if (utils.fileExists(filePath)) {
      const file_contents = await fs.promises.readFile(filePath, 'utf-8');

      return {
        file_contents,
        file_name: fileName,
        file_path: filePath,
        destination: payload.target_directory,
      };
    }

    const acquisitionUrl = payload.odm.OverDriveMedia.License.AcquisitionUrl;
    const mediaId = payload.odm.OverDriveMedia.id;
    const clientId = uuidV1().toUpperCase();
    const licenseHash = this.createLicenseHash(clientId);

    Logger.log('Downloading ODM license from', acquisitionUrl);

    const url = new URL(acquisitionUrl);
    url.searchParams.append('MediaID', mediaId);
    url.searchParams.append('ClientID', clientId);
    url.searchParams.append('OMC', ODM.OMC);
    url.searchParams.append('OS', ODM.OS);
    url.searchParams.append('Hash', licenseHash);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': ODM.UA,
      },
    });

    assert(response.ok, `Failed to download ODM license from ${url} - ${response.statusText}`);

    const file_contents = await response.text();

    await fs.promises.writeFile(filePath, file_contents);

    return {
      file_contents,
      file_name: fileName,
      file_path: filePath,
      destination: payload.target_directory,
    };
  }

  async downloadImage(payload: Payloads.ImageDownload) {
    const imageExtension = path.extname(payload.image_url);
    const imageName = `${payload.type}${imageExtension}`.toLowerCase();

    const destinationPath = path.join(payload.target_directory, imageName);
    if (utils.fileExists(destinationPath)) {
      return destinationPath;
    }

    const downloadPath = `${destinationPath}.part`;
    if (utils.fileExists(downloadPath)) {
      await fs.promises.rm(downloadPath);
    }

    const url = new URL(payload.image_url);
    return this.fileDownloader(url, destinationPath);
  }

  extractMP3Metadata(odm: ODMContent): MP3Metadata {
    const metadata = odm.OverDriveMedia.Metadata;
    const genres = asArray(metadata.Subjects.Subject)
      .map((subject) => subject['#text']?.trim())
      .filter((subject) => subject);

    const languages: string[] = asArray(metadata.Languages.Language)
      .map((language) => language['#text']?.trim())
      .filter((language) => language);

    const creators = wrapDefaults<Map<string, string[]>, string[]>({
      wrap: new Map<string, string[]>(),
      defaultValue: () => [],
      setUndefined: true,
      execute: true,
    });

    for (const creator of asArray(metadata.Creators.Creator)) {
      creators.get(creator.role).push(creator['#text']);
    }

    return {
      authors: creators.get('Author'),
      description: metadata.Description,
      genres,
      languages,
      narrators: creators.get('Narrator'),
      publisher: metadata.Publisher,
      published_date: null,
      series: asArray(metadata.Series),
      sort_title: metadata.SortTitle,
      subtitle: metadata.SubTitle,
      title: metadata.Title,
    };
  }

  /**
   * @todo Output download progress
   */
  private async fileDownloader(url: URL | string, destination: string, headers?: Headers) {
    const useHeaders = headers || new Headers();
    useHeaders.append('User-Agent', ODM.UA);

    const response = await fetch(url, {
      method: 'GET',
      headers: useHeaders,
    });

    assert(response.ok, `Failed to download file from ${url} - ${response.statusText}`);

    const downloadPath = `${destination}.part`;

    const reader = response.body.getReader();
    const writer = fs.createWriteStream(downloadPath);
    const writerComplete = new Promise<void>((resolve) => writer.on('finish', resolve));

    let done = false;
    do {
      const readContent = await reader.read();
      if (readContent.value) {
        writer.write(readContent.value);
      }

      done = readContent.done;
    } while (!done);

    writer.end();

    const TEN_SECONDS_IN_MS = 10_000;

    await Promise.race([
      TimerPromises.setTimeout(TEN_SECONDS_IN_MS, new Error(`File download from ${url} timed out`)),
      writerComplete,
    ]).catch((error) => {
      Logger.error(`Error downloading file from ${url}: ${error.message}`);
      throw error;
    });

    await fs.promises.rename(downloadPath, destination);
    return destination;
  }

  async downloadFile(payload: Payloads.FileDownload) {
    const title = payload.odm.OverDriveMedia.Metadata.Title;
    const partNumber = payload.part.number.padStart(payload.pad, '0');
    const fileName = `${title} - Part ${partNumber}.mp3`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9 -.]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const destinationPath = path.join(payload.target_directory, fileName);
    if (utils.fileExists(destinationPath)) {
      return destinationPath;
    }

    const headers = new Headers();
    headers.append('User-Agent', ODM.UA);
    headers.append('ClientID', payload.license.License.SignedInfo.ClientID);
    headers.append('License', payload.license_paths.file_contents);

    const partFileDestination = path.join(payload.target_directory, `${fileName}.part`);
    if (utils.fileExists(partFileDestination)) {
      const stat = await fs.promises.stat(partFileDestination);
      if (stat.size === parseInt(payload.part.filesize, 10)) {
        await fs.promises.rename(partFileDestination, destinationPath);

        Logger.log(`File ${fileName} already exists and is the correct size`);
        return destinationPath;
      }

      headers.append('Range', `bytes=${stat.size}-`);
    }

    const baseUrl = payload.odm.OverDriveMedia.Formats.Format.Protocols.Protocol.baseurl;
    const url = `${baseUrl}/${payload.part.filename}`;

    return this.fileDownloader(url, destinationPath, headers);
  }

  parseODM(buffer: Buffer) {
    const parser: XMLParser = new XMLParser({
      ignoreAttributes: false,
      cdataPropName: 'cdata',
      commentPropName: 'comment',
      attributeNamePrefix: '',
    });

    const json: ODMContent = parser.parse(Buffer.from(buffer));

    try {
      const parsedCdata: { Metadata: Metadata } = parser.parse(json.OverDriveMedia.cdata);
      json.OverDriveMedia.Metadata = parsedCdata.Metadata;
    } catch {
      throw new Error('Unable to parse Metadata');
    }

    return json;
  }

  parseLicense(licenseContent: string): License {
    const parser: XMLParser = new XMLParser({
      ignoreAttributes: false,
      cdataPropName: 'cdata',
      commentPropName: 'comment',
      attributeNamePrefix: '',
    });

    return parser.parse(licenseContent);
  }

  private createLicenseHash(clientId: string) {
    const rawHash = `${clientId}|${ODM.OMC}|${ODM.OS}|ELOSNOC*AIDEM*EVIRDREVO`;
    const encodedHash = utils.encodeUTF16LE(rawHash);
    const hash = crypto.createHash('sha1').update(encodedHash).digest();

    return Buffer.from(hash).toString('base64');
  }
}
