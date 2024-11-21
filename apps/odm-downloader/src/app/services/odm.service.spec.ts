import { Test, TestingModule } from '@nestjs/testing';
import { OdmService } from './odm.service';

describe('OdmService', () => {
  let service: OdmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OdmService],
    }).compile();

    service = module.get<OdmService>(OdmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
