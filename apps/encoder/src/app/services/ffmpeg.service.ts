import type * as Payloads from '../interfaces/payloads.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'node:path';
import assert from 'node:assert';
import * as fs from 'node:fs';

@Injectable()
export class FfmpegService {
  // TODO: inject dependency
  private readonly ffmpeg = ffmpeg;

  constructor(private readonly configService: ConfigService) {
    // this.ffmpeg.setFfmpegPath(this.configService.get<string>('ffmpeg.path'));
    // this.ffmpeg.setFfprobePath(this.configService.get<string>('ffprobe.path'));
  }

  async encode(input: string, filePath: string) {
    return new Promise<void>((resolve, reject) => {
      this.ffmpeg(input)
        .output(filePath)
        .on('end', () => {
          Logger.log('Encoding finished');
          resolve();
        })
        .on('error', (err) => {
          Logger.error(err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Removes tags from the input file and saves it to the output file
   * @see https://github.com/ping/odmpy/blob/40f9be253b7909ad64a176bc160035038ca4db2a/odmpy/processing/shared.py#L507
   */
  async remux(filePath: string) {
    const ffmpegLogLevel = this.configService.get<string>('ffmpeg.loglevel');
    const input = `${filePath}.part`;

    await fs.promises.rename(filePath, input);

    const basename = path.basename(filePath);
    Logger.log(`Remuxing ${basename}`);

    await new Promise<void>((resolve, reject) => {
      this.ffmpeg(input)
        .outputOptions([
          '-y',
          '-nostdin',
          '-hide_banner',
          '-loglevel',
          ffmpegLogLevel,
          '-c:a',
          'copy',
          '-c:v',
          'copy',
        ])
        .output(filePath)
        .on('end', () => {
          Logger.log(`Remuxing  ${basename} finished`);
          resolve();
        })
        .on('error', (err) => {
          Logger.error(err);
          reject(err);
        })
        .run();
    });

    assert(fs.existsSync(filePath), `Failed to remux ${basename}`);

    await fs.promises.unlink(input);
    Logger.log(`Removed ${input}`);

    return filePath;
  }

  getDuration(input: string) {
    return new Promise<number>((resolve, reject) => {
      this.ffmpeg.ffprobe(input, (err, metadata: ffmpeg.FfprobeData) => {
        if (err) {
          Logger.error(err);
          reject(err);
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  }

  mergeMP3s(input: string[], output: string) {
    const ffmpegLogLevel = this.configService.get<string>('ffmpeg.loglevel');
    const files = input.map((file) => `-i ${file}`).join(' ');
    const filter = input.map((_, index) => `[${index}:a:0]`).join('');
    const filterComplex = `concat=n=${input.length}:v=0:a=1[a]`;

    return new Promise<void>((resolve, reject) => {
      this.ffmpeg()
        .input(`-f lavfi -t 0 -i anullsrc=r=44100:cl=stereo`)
        .input(files)
        .outputOptions([
          '-y',
          '-nostdin',
          '-hide_banner',
          '-loglevel',
          ffmpegLogLevel,
          '-filter_complex',
          `${filter}${filterComplex}`,
          '-map',
          '[a]',
        ])
        .output(output)
        .on('end', () => {
          Logger.log('Merging finished');
          resolve();
        })
        .on('error', (err) => {
          Logger.error(err);
          reject(err);
        })
        .run();
    });
  }

  convertToM4B(input: string, output: string) {
    const ffmpegLogLevel = this.configService.get<string>('ffmpeg.loglevel');
    return new Promise<void>((resolve, reject) => {
      this.ffmpeg(input)
        .outputOptions([
          '-y',
          '-nostdin',
          '-hide_banner',
          '-loglevel',
          ffmpegLogLevel,
          '-c',
          'copy',
          '-f',
          'ipod',
        ])
        .output(output)
        .on('end', () => {
          Logger.log('Conversion finished');
          resolve();
        })
        .on('error', (err) => {
          Logger.error(err);
          reject(err);
        })
        .run();
    });
  }

  async embedMetadata(payload: Payloads.Metadata) {
    const MAX_STRING_LENGTH = 10_000;

    const partFileName = `${payload.file_part.file_path}.part`;
    await fs.promises.rename(payload.file_part.file_path, partFileName);

    const ffmpegLogLevel = this.configService.get<string>('ffmpeg.loglevel');
    const command = this.ffmpeg(partFileName).outputOptions([
      '-y',
      '-nostdin',
      '-hide_banner',
      '-loglevel',
      ffmpegLogLevel,
      '-c:a',
      'copy',
      '-map',
      '0:a',
    ]);

    // Add track number metadata
    command.outputOptions([
      '-metadata',
      `track=${payload.file_part.part.number}/${payload.file_part.total_parts}`,
    ]);

    // Process and add other metadata
    Object.entries(payload.audio_metadata)
      .filter(([, value]) => value !== null && value !== undefined)
      .forEach(([key, value]) => {
        let processedValue: string;

        if (Array.isArray(value)) {
          const joinWith = key === 'genre' ? ';' : ',';
          const arrayValue = [...value];

          while (arrayValue.join(joinWith).length > MAX_STRING_LENGTH) {
            arrayValue.pop();
          }
          processedValue = arrayValue.join(joinWith);
        } else {
          processedValue = String(value);
          if (processedValue.length > MAX_STRING_LENGTH) {
            Logger.warn(`Metadata value for ${key} is too long, truncating`);
            processedValue = processedValue.slice(0, MAX_STRING_LENGTH);
          }
        }

        command.outputOptions(['-metadata', `${key}=${processedValue}`]);
      });

    return new Promise<void>((resolve, reject) => {
      command
        .output(payload.file_part.file_path)
        .on('end', async () => {
          Logger.log('Metadata embedding finished');
          try {
            await fs.promises.unlink(partFileName);
            Logger.log(`Removed temporary file ${partFileName}`);
            resolve();
          } catch (error) {
            Logger.error(`Failed to remove temporary file ${partFileName}:`, error);
            reject(error);
          }
        })
        .on('error', (error) => {
          Logger.error('Error embedding metadata:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * Removes metadata from the input file and saves it to the output file
   */
  async removeMetadata(filePath: string) {
    const partFileName = `${filePath}.part`;
    await fs.promises.rename(filePath, partFileName);

    const ffmpegLogLevel = this.configService.get<string>('ffmpeg.loglevel');
    const ffmpeg = this.ffmpeg(partFileName).outputOptions([
      '-y',
      '-nostdin',
      '-hide_banner',
      '-loglevel',
      ffmpegLogLevel,
      '-map_metadata',
      '-1',
    ]);

    return new Promise<string>((resolve, reject) => {
      ffmpeg
        .output(filePath)
        .on('end', () => {
          Logger.log(`Metadata removal finished for ${filePath}`);
          resolve(filePath);
        })
        .on('error', (error) => {
          Logger.error(error);
          reject(error);
        })
        .run();
    });
  }
}
