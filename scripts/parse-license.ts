import { XMLParser } from 'fast-xml-parser';
import console from 'node:console';
import * as path from 'node:path';
import assert from 'node:assert';
import * as fs from 'node:fs';

const uploadsPath = path.resolve('uploads');
const dirContents = fs.readdirSync(uploadsPath);

const files: string[] = [];
const directories: string[] = [];

for (const item of dirContents) {
  const itemPath = path.join(uploadsPath, item);
  const stat = fs.statSync(itemPath);

  if (stat.isFile()) {
    files.push(item);
  } else if (stat.isDirectory()) {
    directories.push(item);
  }
}

for (const directory of directories) {
  const directoryPath = path.join(uploadsPath, directory);
  const directoryContents = fs.readdirSync(directoryPath);

  for (const item of directoryContents) {
    const itemPath = path.join(directoryPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile()) {
      files.push(item);
    }
  }
}

const licenseFiles = files.filter((file) => file.endsWith('.license'));
assert(licenseFiles.length > 0, 'No license files found in uploads directory');

console.log('License files:', licenseFiles.length);

const [firstLicense] = licenseFiles;

// TODO: this won't suffice for nested license files
const licensePath = path.join(uploadsPath, firstLicense);
const licenseContents = fs.readFileSync(licensePath, 'utf-8');

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: 'cdata',
  commentPropName: 'comment',
  attributeNamePrefix: '',
});

const licenseJson = parser.parse(licenseContents);
console.log('License JSON:', JSON.stringify(licenseJson, null, 2));
