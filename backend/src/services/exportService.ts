import { Book } from '../types/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const booksDir = path.join(__dirname, '../../data/books');

export async function exportToMarkdown(bookId: string): Promise<string | null> {
  // TODO: Implement markdown export
  return null;
}

function buildMarkdown(book: Book): string {
  // TODO: Implement markdown building
  let md = `# ${book.title}\n\n`;
  if (book.author) {
    md += `*By ${book.author}*\n\n`;
  }
  for (const chapter of book.chapters) {
    md += `## ${chapter.title}\n\n${chapter.content}\n\n`;
  }
  return md;
}