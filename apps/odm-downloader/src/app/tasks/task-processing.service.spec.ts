import { TaskProcessingService } from './task-processing.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('TaskProcessingService', () => {
  let service: TaskProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskProcessingService],
    }).compile();

    service = module.get<TaskProcessingService>(TaskProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
