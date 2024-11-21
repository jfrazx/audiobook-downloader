import { Task } from '../entities/task.entity';

export class CreateTaskDto<T = Record<string, unknown>> extends Task<T> {}
