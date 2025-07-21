import { Message } from '../libs/constants/src';
import type { Task } from '../libs/tasks/src';
import { MongoClient } from 'mongodb';
import console from 'node:console';
import mqtt from 'mqtt';

const mongoClient = new MongoClient('mongodb://localhost/audiobook-downloader');
const db = mongoClient.db('audiobook-downloader');
const collection = db.collection<Task>('tasks');

const client = mqtt.connect('mqtt://localhost');

async function main() {
  await mongoClient.connect();

  const tasks = await collection
    .find({
      status: 'failed',
      topic: 'encoder.process.odm',
    })
    .toArray();

  console.log(JSON.stringify(tasks, null, 2));
  console.log(`Found ${tasks.length} failed tasks`);

  for (const task of tasks) {
    await collection.updateOne({ _id: task._id }, { $set: { status: 'pending' } });

    client.publish(
      Message.EncoderProcess,
      JSON.stringify({
        ...task,
        status: 'pending',
      }),
    );
    console.log(`Task ${task._id} has been republished`);
  }
}

main()
  .finally(() => mongoClient.close())
  .finally(() => client.end());
