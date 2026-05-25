import { Request, Response } from 'express';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import {
  GetNewsQueryDto,
  CreateNewsBodyDto,
  CreateNewsQueryDto,
  PublishNewsParamsDto,
} from '@/schemas/news.schemas';
import { NewsService } from '@/services/news.service';
import { MulterFile } from '../types/muterFile';

const logger = buildLogger('NewsController');

export class NewsController {
  static getNews = catchErrors(async (req: Request, res: Response) => {
    const query = req.query as GetNewsQueryDto;
    logger.info('Fetching news notifications', {
      appVersion: query.appVersion,
    });

    const data = await NewsService.getNews(query);
    successHandler(res, { data });
  });

  static createNews = catchErrors(async (req: Request, res: Response) => {
    const body = req.body as CreateNewsBodyDto;
    const query = req.query as CreateNewsQueryDto;
    const file = (req.files as MulterFile[])?.[0];

    logger.info('Creating news notification', { title: body.title });

    const data = await NewsService.createNews(body, file, query);
    successHandler(res, { data });
  });

  static publishNews = catchErrors(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as PublishNewsParamsDto;

    logger.info('Publishing news notification', { id: id });

    const data = await NewsService.publishNews(id);
    successHandler(res, { data });
  });
}
