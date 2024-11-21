import * as path from 'node:path';
import * as fs from 'node:fs';

export async function recursivelyDeleteDirectoryContents(directory: string) {
  const directoryContents = await fs.promises.readdir(directory);

  const files: string[] = [];
  const directories: string[] = [];
  for (const content of directoryContents) {
    const contentPath = path.join(directory, content);
    const stats = await fs.promises.stat(contentPath);

    if (stats.isFile()) {
      files.push(contentPath);
    } else {
      directories.push(contentPath);
    }
  }

  const unlinkPromises = files.map((file) => fs.promises.unlink(file));
  await Promise.all(unlinkPromises);

  const rmdirPromises = directories.map((dir) => recursivelyDeleteDirectoryContents(dir));
  await Promise.all(rmdirPromises);

  return fs.promises.rm(directory);
}

export function fileExists(filePath: string) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (error) {
    return false;
  }
}
