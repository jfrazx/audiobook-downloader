import type { EnvOptions } from '@status/envirator';
import { registerAs } from '@nestjs/config';
import { isTrueMutator } from './mutators';
import { env } from './env';

const options: EnvOptions = {
  defaultValue: false,
  defaultsFor: {
    production: true,
  },
  mutators: [isTrueMutator],
};

export interface ODMReturnsConfig {
  audiobook: boolean;
  ebook: boolean;
}

export const odmReturns = registerAs('odm.return', () => ({
  audiobook: env.provide<boolean>('ODM_DOWNLOADER_AUDIOBOOK_RETURN', options),
  ebook: env.provide<boolean>('ODM_DOWNLOADER_EBOOK_RETURN', options),
}));

export interface ODMCleanupConfig {
  directory: string;
  db: boolean;
}

export const odmCleanup = registerAs('odm.cleanup', () => ({
  directory: env.provide<string>('ODM_DOWNLOADER_CLEANUP_DIRECTORY', options),
  db: env.provide<boolean>('ODM_DOWNLOADER_CLEANUP_DB', options),
}));
