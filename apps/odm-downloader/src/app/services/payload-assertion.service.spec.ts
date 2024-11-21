import { PayloadAssertionService } from './payload-assertion.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('PayloadAssertionService', () => {
  let service: PayloadAssertionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayloadAssertionService],
    }).compile();

    service = module.get<PayloadAssertionService>(PayloadAssertionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
