import { registerAs } from '@nestjs/config';
import { env } from './env';

export const ffmpegConfig = registerAs('ffmpeg', () => ({
  loglevel: env.provide<string>('FFMPEG_LOG_LEVEL', {
    defaultValue: 'info',
    defaultsFor: {
      development: 'debug',
    },
  }),
}));
