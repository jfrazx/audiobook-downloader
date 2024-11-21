import { Test, TestingModule } from '@nestjs/testing';
import { OdmController } from './odm.controller';

describe('OdmController', () => {
  let controller: OdmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OdmController],
    }).compile();

    controller = module.get<OdmController>(OdmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
