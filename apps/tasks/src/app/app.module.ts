import { MongooseModule } from '@nestjs/mongoose';
import { TaskModule } from './tasks/task.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/audiobook-downloader'), TaskModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
