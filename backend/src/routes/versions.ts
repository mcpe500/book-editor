import { Router } from 'express';
import * as versionService from '../services/versionService.js';

const router = Router();

// GET /api/books/:id/versions - List versions for book
router.get('/:id/versions', async (req, res, next) => {
  try {
    const versions = await versionService.getVersions(req.params.id);
    res.json(versions);
  } catch (error) {
    next(error);
  }
});

// POST /api/books/:id/versions - Create version snapshot
router.post('/:id/versions', async (req, res, next) => {
  try {
    const { label } = req.body;
    const version = await versionService.createVersion(req.params.id, label);
    if (!version) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    res.status(201).json(version);
  } catch (error) {
    next(error);
  }
});

// POST /api/books/:id/versions/:vid/restore - Restore version
router.post('/:id/versions/:vid/restore', async (req, res, next) => {
  try {
    const book = await versionService.restoreVersion(req.params.id, req.params.vid);
    if (!book) {
      res.status(404).json({ error: 'Book or version not found' });
      return;
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/books/:id/versions/:vid - Delete version
router.delete('/:id/versions/:vid', async (req, res, next) => {
  try {
    const success = await versionService.deleteVersion(req.params.id, req.params.vid);
    if (!success) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
