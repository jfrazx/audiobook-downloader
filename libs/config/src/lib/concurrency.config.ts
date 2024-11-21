import { registerAs } from '@nestjs/config';
import { env } from './env';

export const encodingConcurrency = registerAs('encoder.concurrency', () => ({
  book_files: env.provide<number>('ENCODING_CONCURRENCY', {
    defaultValue: 2,
    defaultsFor: {
      production: 5,
    },
  }),
}));

export const odmConcurrency = registerAs('odm.concurrency', () => ({
  book_files: env.provide<number>('ODM_DOWNLOADER_BOOK_FILES_CONCURRENCY', {
    defaultValue: 1,
    defaultsFor: {
      production: 5,
    },
  }),
}));
