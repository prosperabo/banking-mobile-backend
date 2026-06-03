import { Router } from 'express';
import multer from 'multer';
import { NewsController } from '@/controllers/news.controller';
import { validateRequest } from '../middlewares';
import {
  getNewsValidator,
  createNewsValidator,
  publishNewsValidator,
} from '../validators/news.validator';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', validateRequest(...getNewsValidator), NewsController.getNews);

router.post(
  '/',
  upload.single('image'),
  validateRequest(...createNewsValidator),
  NewsController.createNews
);

router.post(
  '/publish/:id',
  validateRequest(...publishNewsValidator),
  NewsController.publishNews
);

export default router;
