import { registerAs } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { env } from './env';

export interface ApiConfig {
  host: string;
  port: number;
  keys: string[];
}

export const api = registerAs('api', () => ({
  host: env.provide<string>('API_HOST', {
    defaultValue: 'http://localhost/api',
  }),

  port: env.provide<number>('API_PORT', {
    defaultValue: 3000,
    mutators: parseInt,
  }),

  keys: env.provide<string[]>('API_KEYS', {
    defaultValue: crypto.randomBytes(16).toString('hex'),
    defaultsFor: {
      development: 'dev-api-key',
    },
    mutators: [(value: string) => value.split(',')],
  }),
}));
