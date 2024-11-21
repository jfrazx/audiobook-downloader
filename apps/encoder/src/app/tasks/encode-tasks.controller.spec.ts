import { Test, TestingModule } from '@nestjs/testing';
import { EncodeTasksController } from './encode-tasks.controller';
import { EncodeTasksService } from './encode-tasks.service';

describe('EncodeTasksController', () => {
  let controller: EncodeTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EncodeTasksController],
      providers: [EncodeTasksService],
    }).compile();

    controller = module.get<EncodeTasksController>(EncodeTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
