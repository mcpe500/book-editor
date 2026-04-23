import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import { generateId } from '../utils/uuid.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const bookId = _req.params.id as string;
    const dir = path.join(uploadsDir, bookId);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueId = generateId();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const router = Router();

router.post('/:id/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/${req.params.id}/${req.file.filename}`;
    res.status(201).json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/assets/:filename', async (req, res, next) => {
  try {
    const filepath = path.join(uploadsDir, req.params.id, req.params.filename);
    await fs.unlink(filepath);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

router.get('/:id/assets', async (req, res, next) => {
  try {
    const dir = path.join(uploadsDir, req.params.id);
    await fs.access(dir);
    const files = await fs.readdir(dir);
    const fileInfos = await Promise.all(
      files.map(async (filename) => {
        const filepath = path.join(dir, filename);
        const stats = await fs.stat(filepath);
        return {
          filename,
          size: stats.size,
          url: `/uploads/${req.params.id}/${filename}`,
          createdAt: stats.birthtime,
        };
      })
    );
    res.json(fileInfos);
  } catch {
    res.json([]);
  }
});

export default router;
