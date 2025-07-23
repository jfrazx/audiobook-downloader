import type { ApiConfig, WatcherConfig } from '@abd/config';
import { WatcherService } from './watcher.service';
import { ConfigService } from '@nestjs/config';
import { Controller, Logger } from '@nestjs/common';

@Controller()
export class WatcherController {
  private readonly logger = new Logger(WatcherController.name);

  constructor(
    private readonly watcherService: WatcherService,
    private readonly configService: ConfigService,
  ) {
    const watcherConfig = this.configService.get<WatcherConfig>('watcher');
    const apiConfig = this.configService.get<ApiConfig>('api');

    this.watcherService.watch(watcherConfig, apiConfig).subscribe({
      error: (error) => this.logger.error('Error in watcher service', error),
      complete: () => {
        throw new Error('Watcher service has completed unexpectedly');
      },
    });
  }
}
