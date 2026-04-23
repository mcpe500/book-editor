import { Book, Chapter } from '../types/index.js';
import { readJSON, writeJSON, ensureDir } from '../utils/jsonFile.js';
import { generateId } from '../utils/uuid.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = path.join(__dirname, '../../../data/books');

async function getBookPath(id: string): Promise<string> {
  await ensureDir(dataDir);
  return path.join(dataDir, `${id}.json`);
}

export async function getAllBooks(): Promise<Book[]> {
  try {
    await ensureDir(dataDir);
    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const books: Book[] = [];
    for (const file of jsonFiles) {
      try {
        const filepath = path.join(dataDir, file);
        const book = await readJSON<Book>(filepath);
        books.push(book);
      } catch {
        // Skip invalid files
      }
    }

    return books.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    const filepath = await getBookPath(id);
    return await readJSON<Book>(filepath);
  } catch {
    return null;
  }
}

export async function createBook(title: string, author?: string, description?: string): Promise<Book> {
  await ensureDir(dataDir);

  const now = new Date().toISOString();
  const book: Book = {
    id: generateId(),
    title,
    author,
    description,
    createdAt: now,
    updatedAt: now,
    settings: {
      fontFamily: 'sans',
      fontSize: 16,
      lineHeight: 1.6,
      theme: 'light',
    },
    chapters: [],
  };

  const filepath = await getBookPath(book.id);
  await writeJSON(filepath, book);

  return book;
}

export async function updateBook(id: string, data: Partial<Book>): Promise<Book | null> {
  const book = await getBookById(id);
  if (!book) return null;

  const updatedBook: Book = {
    ...book,
    ...data,
    id: book.id, // Prevent ID change
    createdAt: book.createdAt, // Prevent createdAt change
    updatedAt: new Date().toISOString(),
  };

  const filepath = await getBookPath(id);
  await writeJSON(filepath, updatedBook);

  return updatedBook;
}

export async function deleteBook(id: string): Promise<boolean> {
  try {
    const filepath = await getBookPath(id);
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function addChapter(bookId: string, title: string, content = ''): Promise<Chapter | null> {
  const book = await getBookById(bookId);
  if (!book) return null;

  const maxOrder = book.chapters.reduce((max, c) => Math.max(max, c.order), 0);
  const now = new Date().toISOString();

  const chapter: Chapter = {
    id: generateId(),
    title,
    order: maxOrder + 1,
    content,
    createdAt: now,
    updatedAt: now,
  };

  book.chapters.push(chapter);
  book.updatedAt = now;

  const filepath = await getBookPath(bookId);
  await writeJSON(filepath, book);

  return chapter;
}

export async function updateChapter(bookId: string, chapterId: string, data: Partial<Chapter>): Promise<Chapter | null> {
  const book = await getBookById(bookId);
  if (!book) return null;

  const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
  if (chapterIndex === -1) return null;

  const now = new Date().toISOString();
  const updatedChapter: Chapter = {
    ...book.chapters[chapterIndex],
    ...data,
    id: book.chapters[chapterIndex].id, // Prevent ID change
    createdAt: book.chapters[chapterIndex].createdAt, // Prevent createdAt change
    updatedAt: now,
  };

  book.chapters[chapterIndex] = updatedChapter;
  book.updatedAt = now;

  const filepath = await getBookPath(bookId);
  await writeJSON(filepath, book);

  return updatedChapter;
}

export async function deleteChapter(bookId: string, chapterId: string): Promise<boolean> {
  const book = await getBookById(bookId);
  if (!book) return false;

  const chapterIndex = book.chapters.findIndex(c => c.id === chapterId);
  if (chapterIndex === -1) return false;

  book.chapters.splice(chapterIndex, 1);

  // Reorder remaining chapters
  book.chapters.forEach((chapter, index) => {
    chapter.order = index + 1;
  });

  book.updatedAt = new Date().toISOString();

  const filepath = await getBookPath(bookId);
  await writeJSON(filepath, book);

  return true;
}

export async function reorderChapters(bookId: string, chapterIds: string[]): Promise<boolean> {
  const book = await getBookById(bookId);
  if (!book) return false;

  const reorderedChapters: Chapter[] = [];
  for (let i = 0; i < chapterIds.length; i++) {
    const chapter = book.chapters.find(c => c.id === chapterIds[i]);
    if (chapter) {
      chapter.order = i + 1;
      reorderedChapters.push(chapter);
    }
  }

  book.chapters = reorderedChapters;
  book.updatedAt = new Date().toISOString();

  const filepath = await getBookPath(bookId);
  await writeJSON(filepath, book);

  return true;
}

export async function getChapter(bookId: string, chapterId: string): Promise<Chapter | null> {
  const book = await getBookById(bookId);
  if (!book) return null;

  return book.chapters.find(c => c.id === chapterId) || null;
}
