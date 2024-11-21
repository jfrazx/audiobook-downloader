import type { Task, CreateTaskDto, UpdateTaskDto } from '@abd/tasks';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskService } from './task.service';
import { Controller } from '@nestjs/common';
import { TaskEvent } from '@abd/constants';
import { ObjectId } from 'mongoose';

@Controller()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @MessagePattern(TaskEvent.Create)
  create(@Payload() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @MessagePattern(TaskEvent.CreateMany)
  createMany(@Payload() createTaskDtos: CreateTaskDto[]) {
    return this.taskService.createMany(createTaskDtos);
  }

  @MessagePattern(TaskEvent.FindAll)
  findAll(@Payload() task: Partial<Task> = {}) {
    return this.taskService.findAll(task);
  }

  @MessagePattern(TaskEvent.FindOne)
  findOne(@Payload() task: Partial<Task>) {
    return this.taskService.findOne(task);
  }

  @MessagePattern(TaskEvent.Update)
  update(@Payload() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(updateTaskDto);
  }

  @MessagePattern(TaskEvent.Remove)
  remove(@Payload() id: ObjectId) {
    return this.taskService.remove(id);
  }

  @MessagePattern(TaskEvent.RemoveMany)
  removeMany(@Payload() task: Partial<Task>) {
    return this.taskService.removeMany(task);
  }
}
