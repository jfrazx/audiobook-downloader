import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor() {
    // Schedule to run every hour
    cron.schedule('0 * * * *', () => {
      this.logger.log('Running scheduled library scan...');
      // TODO: Implement logic to query for libraries and create jobs
    });
  }
}
