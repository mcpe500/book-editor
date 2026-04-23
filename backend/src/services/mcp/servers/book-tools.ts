import { MCPServer, MCPTool, MCPToolResult, Book, Chapter } from '../../../types/index.js';
import { readJSON, writeJSON } from '../../../utils/jsonFile.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = path.join(__dirname, '../../../../data');

export const bookToolsMCPServer: MCPServer = {
  id: 'book-tools',
  name: 'book-tools',
  description: 'Tools for reading and writing book content',
  transport: 'stdio',
  enabled: true,
};

export const bookTools: MCPTool[] = [
  {
    name: 'getBookOutline',
    description: 'Get the structure of a book including all chapters',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'getChapterContent',
    description: 'Get the content of a specific chapter',
    inputSchema: {
      type: 'object',
      properties: { chapterId: { type: 'string', description: 'Chapter ID' } },
      required: ['chapterId'],
    },
  },
  {
    name: 'updateChapterContent',
    description: 'Update the content of a chapter',
    inputSchema: {
      type: 'object',
      properties: { chapterId: { type: 'string' }, content: { type: 'string' } },
      required: ['chapterId', 'content'],
    },
  },
  {
    name: 'createChapter',
    description: 'Create a new chapter',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        order: { type: 'number' },
        content: { type: 'string', default: '' },
      },
      required: ['title', 'order'],
    },
  },
  {
    name: 'deleteChapter',
    description: 'Delete a chapter',
    inputSchema: {
      type: 'object',
      properties: { chapterId: { type: 'string' } },
      required: ['chapterId'],
    },
  },
  {
    name: 'searchBook',
    description: 'Search all content in the book',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'insertText',
    description: 'Insert text at a specific position in a chapter',
    inputSchema: {
      type: 'object',
      properties: {
        chapterId: { type: 'string' },
        position: { type: 'number' },
        text: { type: 'string' },
      },
      required: ['chapterId', 'position', 'text'],
    },
  },
  {
    name: 'replaceText',
    description: 'Replace text in a range',
    inputSchema: {
      type: 'object',
      properties: {
        chapterId: { type: 'string' },
        start: { type: 'number' },
        end: { type: 'number' },
        text: { type: 'string' },
      },
      required: ['chapterId', 'start', 'end', 'text'],
    },
  },
  {
    name: 'getWordCount',
    description: 'Get word count for a chapter or entire book',
    inputSchema: {
      type: 'object',
      properties: { chapterId: { type: 'string' } },
    },
  },
];

function getBookPath(bookId: string): string {
  return path.join(dataDir, 'books', `${bookId}.json`);
}

export const bookToolsHandlers: Record<string, Function> = {
  getTools: () => bookTools,

  async getBookOutline(bookId: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const outline = {
        title: book.title,
        author: book.author,
        chapters: book.chapters.map(c => ({
          id: c.id,
          title: c.title,
          order: c.order,
          wordCount: c.content.split(/\s+/).filter(Boolean).length,
        })),
      };
      return { content: [{ type: 'text', text: JSON.stringify(outline, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async getChapterContent(bookId: string, chapterId: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const chapter = book.chapters.find(c => c.id === chapterId);
      if (!chapter) {
        return { content: [{ type: 'text', text: 'Chapter not found' }], isError: true };
      }
      return { content: [{ type: 'text', text: chapter.content }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async updateChapterContent(bookId: string, chapterId: string, content: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const chapter = book.chapters.find(c => c.id === chapterId);
      if (!chapter) {
        return { content: [{ type: 'text', text: 'Chapter not found' }], isError: true };
      }
      chapter.content = content;
      chapter.updatedAt = new Date().toISOString();
      book.updatedAt = new Date().toISOString();
      await writeJSON(getBookPath(bookId), book);
      return { content: [{ type: 'text', text: 'Chapter updated successfully' }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async createChapter(bookId: string, title: string, order: number, content = ''): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const newChapter: Chapter = {
        id: crypto.randomUUID(),
        title,
        order,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      book.chapters.push(newChapter);
      book.updatedAt = new Date().toISOString();
      await writeJSON(getBookPath(bookId), book);
      return { content: [{ type: 'text', text: `Chapter created with ID: ${newChapter.id}` }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async deleteChapter(bookId: string, chapterId: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const index = book.chapters.findIndex(c => c.id === chapterId);
      if (index === -1) {
        return { content: [{ type: 'text', text: 'Chapter not found' }], isError: true };
      }
      book.chapters.splice(index, 1);
      book.updatedAt = new Date().toISOString();
      await writeJSON(getBookPath(bookId), book);
      return { content: [{ type: 'text', text: 'Chapter deleted' }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async searchBook(bookId: string, query: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const results: Array<{ chapterId: string; chapterTitle: string; matches: string[] }> = [];

      for (const chapter of book.chapters) {
        const matches: string[] = [];
        const lines = chapter.content.split('\n');
        for (const line of lines) {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            matches.push(line.trim().substring(0, 200));
          }
        }
        if (matches.length > 0) {
          results.push({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            matches,
          });
        }
      }

      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async insertText(bookId: string, chapterId: string, position: number, text: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const chapter = book.chapters.find(c => c.id === chapterId);
      if (!chapter) {
        return { content: [{ type: 'text', text: 'Chapter not found' }], isError: true };
      }
      chapter.content = chapter.content.slice(0, position) + text + chapter.content.slice(position);
      chapter.updatedAt = new Date().toISOString();
      book.updatedAt = new Date().toISOString();
      await writeJSON(getBookPath(bookId), book);
      return { content: [{ type: 'text', text: 'Text inserted' }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async replaceText(bookId: string, chapterId: string, start: number, end: number, text: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      const chapter = book.chapters.find(c => c.id === chapterId);
      if (!chapter) {
        return { content: [{ type: 'text', text: 'Chapter not found' }], isError: true };
      }
      chapter.content = chapter.content.slice(0, start) + text + chapter.content.slice(end);
      chapter.updatedAt = new Date().toISOString();
      book.updatedAt = new Date().toISOString();
      await writeJSON(getBookPath(bookId), book);
      return { content: [{ type: 'text', text: 'Text replaced' }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },

  async getWordCount(bookId: string, chapterId?: string): Promise<MCPToolResult> {
    try {
      const book = await readJSON<Book>(getBookPath(bookId));
      if (chapterId) {
        const chapter = book.chapters.find(c => c.id === chapterId);
        const count = chapter?.content.split(/\s+/).filter(Boolean).length ?? 0;
        return { content: [{ type: 'text', text: `Word count: ${count}` }] };
      }
      const total = book.chapters.reduce((sum, c) => sum + c.content.split(/\s+/).filter(Boolean).length, 0);
      return { content: [{ type: 'text', text: `Total word count: ${total}` }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  },
};