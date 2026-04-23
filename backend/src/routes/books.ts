import { Router } from 'express';
import * as bookService from '../services/bookService.js';

const router = Router();

// GET /api/books - List all books
router.get('/', async (_req, res, next) => {
  try {
    const books = await bookService.getAllBooks();
    res.json(books);
  } catch (error) {
    next(error);
  }
});

// POST /api/books - Create new book
router.post('/', async (req, res, next) => {
  try {
    const { title, author, description } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const book = await bookService.createBook(title, author, description);
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
});

// GET /api/books/:id - Get book by ID
router.get('/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookById(req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
});

// PUT /api/books/:id - Update book
router.put('/:id', async (req, res, next) => {
  try {
    const { title, author, description, settings } = req.body;
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (description !== undefined) updateData.description = description;
    if (settings !== undefined) updateData.settings = settings;

    const book = await bookService.updateBook(req.params.id, updateData);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/books/:id - Delete book
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await bookService.deleteBook(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/books/:id/chapters - Add chapter
router.post('/:id/chapters', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const chapter = await bookService.addChapter(req.params.id, title, content);
    if (!chapter) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(201).json(chapter);
  } catch (error) {
    next(error);
  }
});

// PUT /api/books/:id/chapters/:cid - Update chapter
router.put('/:id/chapters/:cid', async (req, res, next) => {
  try {
    const { title, content, order } = req.body;
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (order !== undefined) updateData.order = order;

    const chapter = await bookService.updateChapter(req.params.id, req.params.cid, updateData);
    if (!chapter) {
      res.status(404).json({ error: 'Book or chapter not found' });
      return;
    }
    res.json(chapter);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/books/:id/chapters/:cid - Delete chapter
router.delete('/:id/chapters/:cid', async (req, res, next) => {
  try {
    const success = await bookService.deleteChapter(req.params.id, req.params.cid);
    if (!success) {
      res.status(404).json({ error: 'Book or chapter not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/books/:id/chapters/reorder - Reorder chapters
router.patch('/:id/chapters/reorder', async (req, res, next) => {
  try {
    const { chapterIds } = req.body;
    if (!Array.isArray(chapterIds)) {
      res.status(400).json({ error: 'chapterIds must be an array' });
      return;
    }
    const success = await bookService.reorderChapters(req.params.id, chapterIds);
    if (!success) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
