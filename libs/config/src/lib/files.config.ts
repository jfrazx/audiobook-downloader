import { registerAs } from '@nestjs/config';
import * as process from 'node:process';
import * as path from 'node:path';
import { env } from './env';

export const files = registerAs('files', () => ({
  uploadPath: env.provide<string>('UPLOAD_DESTINATION', {
    defaultsFor: {
      development: path.join(process.cwd(), 'uploads'),
      production: '/tmp/uploads',
    },
  }),
}));
