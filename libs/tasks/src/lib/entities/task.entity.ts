import { HydratedDocument, ObjectId, Schema as MongooseSchema } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Status } from '../constants/status.enum';

export type TaskDocument<T = Record<string, unknown>> = HydratedDocument<Task<T>>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Task<Payload = Record<string, unknown>> {
  _id?: ObjectId;

  @Prop()
  completed_at?: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  error?: Record<string, unknown>;

  @Prop(MongooseSchema.Types.ObjectId)
  parent_task_id?: ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  payload: Payload;

  @Prop({ type: String, enum: Status, default: Status.Pending })
  status: Status;

  @Prop({ type: String })
  topic: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
