import { WatcherService } from './watcher.service';
import { Test } from '@nestjs/testing';

describe('WatcherService', () => {
  let service: WatcherService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [WatcherService],
    }).compile();

    service = app.get<WatcherService>(WatcherService);
  });
});
