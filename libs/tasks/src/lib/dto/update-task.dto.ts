import type { ObjectId, QueryOptions } from 'mongoose';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { Task } from '../entities/task.entity';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  _id: ObjectId;
  updateOptions: QueryOptions<Task>;
}
