import { registerAs } from '@nestjs/config';
import { env } from './env';

const allowedExtensions = ['.odm', '.ascm', '.epub'];

export interface WatcherConfig {
  directories: string[];
  extensions: string[];
  apiKey: string;
}

export const watcher = registerAs('watcher', () => ({
  // TODO: allow directory specific extensions
  // possible format: /path/to/directory:ext1|ext2|ext3
  directories: env.provide<string[]>('WATCH_DIRECTORIES', {
    mutators: (value: string) => value.split(','),
  }),

  extensions: env.provide<string[]>('WATCH_EXTENSIONS', {
    defaultValue: '.odm',
    mutators: (value: string) =>
      value
        .split(',')
        .map((ext) => ext.toLowerCase().trim())
        .filter((ext) => allowedExtensions.includes(ext)),
  }),

  apiKey: env.provide<string>('WATCHER_API_KEY', {
    defaultsFor: {
      development: 'dev-api-key',
    },
  }),
}));
