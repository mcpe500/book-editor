import fs from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';

export async function readJSON<T>(filepath: string): Promise<T> {
  const data = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(data) as T;
}

export async function writeJSON<T>(filepath: string, data: T): Promise<void> {
  const tempPath = filepath + '.tmp';
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, filepath);
}

export async function ensureDir(dirpath: string): Promise<void> {
  if (!existsSync(dirpath)) {
    await fs.mkdir(dirpath, { recursive: true });
  }
}

export async function fileExists(filepath: string): Promise<boolean> {
  return existsSync(filepath);
}

export async function deleteFile(filepath: string): Promise<void> {
  if (existsSync(filepath)) {
    await fs.unlink(filepath);
  }
}

export async function readDir(dirpath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirpath);
  } catch {
    return [];
  }
}