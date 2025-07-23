import type { Model, ObjectId, RootFilterQuery, UpdateQuery } from 'mongoose';
import { Task, TaskDocument, CreateTaskDto, UpdateTaskDto } from '@abd/tasks';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import assert from 'node:assert';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>) {}

  create<T>(createTaskDto: CreateTaskDto<T>) {
    assert(createTaskDto.status, 'Task status must be provided');
    assert(createTaskDto.topic, 'Task topic must be provided');

    return this.taskModel.create(createTaskDto);
  }

  createMany<T>(createTaskDtos: CreateTaskDto<T>[]) {
    assert(createTaskDtos.length, 'Task list must not be empty');

    return this.taskModel.insertMany(createTaskDtos);
  }

  findAll(task: Partial<Task> | RootFilterQuery<Task> = {}) {
    return this.taskModel.find(task).exec();
  }

  findOne<T>(task: Partial<Task<T>> = {}) {
    return this.taskModel.findOne(task).exec();
  }

  update(updateTaskDto: UpdateTaskDto | UpdateQuery<Task>) {
    const { _id: id, updateOptions = { lean: true }, ...update } = updateTaskDto;

    assert(id, 'Task ID must be provided');
    return this.taskModel.findByIdAndUpdate(id, update, updateOptions).exec();
  }

  remove(id: ObjectId) {
    assert(id, 'Task ID must be provided');
    return this.taskModel.findByIdAndDelete(id).exec();
  }

  removeMany(task: Partial<Task> | RootFilterQuery<Task>) {
    assert(Object.keys(task).length, 'Task filter must be provided');
    return this.taskModel.deleteMany(task).exec();
  }
}
