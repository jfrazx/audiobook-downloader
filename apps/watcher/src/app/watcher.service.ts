import { ApiConfig, WatcherConfig } from '@abd/config';
import { Injectable, Logger } from '@nestjs/common';
import { from, map, mergeMap, Subject, tap } from 'rxjs';
import * as path from 'node:path';
import assert from 'node:assert';
import chokidar from 'chokidar';
import * as fs from 'node:fs';

@Injectable()
export class WatcherService {
  watch(watcher: WatcherConfig, api: ApiConfig) {
    assert(watcher?.directories.length, 'No directories to watch');
    assert(watcher?.extensions.length, 'No extensions to watch');
    assert(api?.host, 'API host is not defined');

    return from(watcher.directories).pipe(
      mergeMap((directory) =>
        this.watchDirectory(directory, watcher.extensions).pipe(
          map((filePath) => ({
            filePath,
            url: this.buildUrl(api, filePath),
          })),
        ),
      ),
      mergeMap(({ filePath, url }) =>
        from(this.sendFile(filePath, url, watcher.apiKey)).pipe(
          tap((response: Response) =>
            Logger.log(
              `File ${filePath} has been sent with status ${response.status} ${response.statusText}`,
            ),
          ),
          mergeMap(() => fs.promises.unlink(filePath)),
          map(() => filePath),
        ),
      ),
    );
  }

  private watchDirectory(directory: string, extensions: string[]) {
    const subject = new Subject<string>();

    // TODO: do not watch recursively
    chokidar
      .watch(directory, {
        persistent: true,
      })
      .on('add', (filePath: string) => {
        if (extensions.includes(path.extname(filePath))) {
          console.log(`File ${filePath} has been added`);
          subject.next(filePath);
        }
      });

    return subject;
  }

  private buildUrl(api: ApiConfig, filePath: string) {
    const extension = path.extname(filePath);
    const url = new URL(api.host);
    url.port = api.port.toString();

    switch (extension) {
      case '.odm': {
        const uri = url.pathname + 'odm/upload';
        return new URL(uri, url);
      }

      case '.pdf':
      case '.ascm':
      case '.epub': {
        const uri = url.pathname + 'upload';
        return new URL(uri, url);
      }

      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }
  }

  private async sendFile(filePath: string, url: URL, apiKey: string) {
    const fileContents = await fs.promises.readFile(filePath);
    const filename = path.basename(filePath);
    const blob = new Blob([fileContents]);
    const body = new FormData();

    body.append('file', blob, filename);

    Logger.log(`Sending file ${filename} to ${url}`);
    return this.post(url, apiKey, body);
  }

  private async post(url: URL, apiKey: string, body?: FormData) {
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
        },
        body,
      });
    } catch (error) {
      Logger.error(error.message);
      Logger.warn(`Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Single retry
      return fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
        },
        body,
      });
    }
  }
}
