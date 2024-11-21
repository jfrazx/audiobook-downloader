import { WatcherController } from './watcher.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { WatcherService } from './watcher.service';

describe('WatcherController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [WatcherController],
      providers: [WatcherService],
    }).compile();
  });
});
