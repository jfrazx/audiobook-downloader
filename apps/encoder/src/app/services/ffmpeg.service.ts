import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import ffmepg from 'fluent-ffmpeg';
import * as path from 'node:path';
import * as fs from 'node:fs';

@Injectable()
export class FfmpegService {
  constructor(private readonly configService: ConfigService) {}

  async encode(input: string, filePath: string) {
    return new Promise<void>((resolve, reject) => {
      ffmepg(input)
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
      ffmepg(input)
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

    await fs.promises.unlink(input);
    Logger.log(`Removed ${input}`);

    return filePath;
  }

  getDuration(input: string) {
    return new Promise<number>((resolve, reject) => {
      ffmepg.ffprobe(input, (err, metadata: ffmepg.FfprobeData) => {
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
      ffmepg()
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
      ffmepg(input)
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
}
