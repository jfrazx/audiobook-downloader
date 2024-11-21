import { Test, TestingModule } from '@nestjs/testing';
import { ODMTaskController } from './odm-task.controller';

describe('ODMTaskController', () => {
  let controller: ODMTaskController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ODMTaskController],
      providers: [],
    }).compile();

    controller = module.get<ODMTaskController>(ODMTaskController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
