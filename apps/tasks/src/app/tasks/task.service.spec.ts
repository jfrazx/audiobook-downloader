import { Test } from '@nestjs/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TaskService],
    }).compile();

    service = module.get(TaskService);
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });
});
