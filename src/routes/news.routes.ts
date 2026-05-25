import { Router } from 'express';
import { NewsController } from '@/controllers/news.controller';
import { validateRequest } from '../middlewares';
import {
  getNewsValidator,
  createNewsValidator,
  publishNewsValidator,
} from '../validators/news.validator';

const router = Router();

router.get('/', validateRequest(...getNewsValidator), NewsController.getNews);

router.post(
  '/',
  validateRequest(...createNewsValidator),
  NewsController.createNews
);

router.post(
  '/publish/:id',
  validateRequest(...publishNewsValidator),
  NewsController.publishNews
);

export default router;
