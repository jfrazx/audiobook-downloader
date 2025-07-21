import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Message } from '@abd/constants';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern(Message.ProcessAudiobookFile)
  async processAudiobookFile(data: any) {
    return this.appService.processAudiobookFile(data);
  }
}
