import { Version, Book } from '../types/index.js';
import { readJSON, writeJSON, ensureDir } from '../utils/jsonFile.js';
import { generateId } from '../utils/uuid.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const versionsDir = path.join(__dirname, '../../../data/versions');

async function getVersionDir(bookId: string): Promise<string> {
  const dir = path.join(versionsDir, bookId);
  await ensureDir(dir);
  return dir;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export async function getVersions(bookId: string): Promise<Version[]> {
  try {
    const dir = await getVersionDir(bookId);
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const versions: Version[] = [];
    for (const file of jsonFiles) {
      try {
        const filepath = path.join(dir, file);
        const version = await readJSON<Version>(filepath);
        versions.push(version);
      } catch {
        // Skip invalid files
      }
    }

    return versions.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch {
    return [];
  }
}

export async function getVersion(bookId: string, versionId: string): Promise<Version | null> {
  try {
    const dir = await getVersionDir(bookId);
    const filepath = path.join(dir, `${versionId}.json`);
    return await readJSON<Version>(filepath);
  } catch {
    return null;
  }
}

export async function createVersion(bookId: string, label?: string): Promise<Version | null> {
  try {
    const booksDir = path.join(__dirname, '../../../data/books');
    const bookPath = path.join(booksDir, `${bookId}.json`);
    const book = await readJSON<Book>(bookPath);

    const version: Version = {
      id: generateId(),
      bookId,
      timestamp: new Date().toISOString(),
      label,
      snapshot: JSON.stringify(book),
      wordCount: book.chapters.reduce((sum, ch) => sum + countWords(ch.content), 0),
    };

    const dir = await getVersionDir(bookId);
    const filepath = path.join(dir, `${version.id}.json`);
    await writeJSON(filepath, version);

    return version;
  } catch {
    return null;
  }
}

export async function restoreVersion(bookId: string, versionId: string): Promise<Book | null> {
  try {
    const version = await getVersion(bookId, versionId);
    if (!version) return null;

    const book: Book = JSON.parse(version.snapshot);
    book.updatedAt = new Date().toISOString();

    const booksDir = path.join(__dirname, '../../../data/books');
    const bookPath = path.join(booksDir, `${bookId}.json`);
    await writeJSON(bookPath, book);

    return book;
  } catch {
    return null;
  }
}

export async function deleteVersion(bookId: string, versionId: string): Promise<boolean> {
  try {
    const dir = await getVersionDir(bookId);
    const filepath = path.join(dir, `${versionId}.json`);
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}
