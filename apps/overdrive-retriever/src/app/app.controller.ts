import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { Message } from '@abd/constants';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern(Message.RetrieveOverdrive)
  async retrieveOverdrive(data: any) {
    return this.appService.retrieveOverdrive(data);
  }
}
