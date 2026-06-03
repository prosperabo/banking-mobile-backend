import { Request, Response } from 'express';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import {
  GetNewsQueryDto,
  CreateNewsBodyDto,
  CreateNewsQueryDto,
  PublishNewsParamsDto,
} from '@/schemas/news.schemas';
import { MulterFile } from '@/types/muterFile';
import { NewsService } from '@/services/news.service';
import { NotificationService } from '../services/notification.service';

const logger = buildLogger('NewsController');

export class NewsController {
  static getNews = catchErrors(async (req: Request, res: Response) => {
    const query = req.query as GetNewsQueryDto;
    logger.info('Fetching novelties', { appVersion: query.appVersion });
    const items = await NewsService.getNews(query);
    successHandler(res, { items });
  });

  static createNews = catchErrors(async (req: Request, res: Response) => {
    const body = req.body as CreateNewsBodyDto;
    const query = req.query as CreateNewsQueryDto;
    const file = req.file as MulterFile | undefined;
    logger.info('Creating news notification', { title: body.title });
    const data = await NewsService.createNews(body, file, query);
    successHandler(res, { data });
  });

  static publishNews = catchErrors(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : (req.params.id ?? '');
    const param: PublishNewsParamsDto = { id };
    logger.info('Publishing news notification', { id: param.id });
    const data = await NewsService.publishNews(param.id);
    await NotificationService.sendNewNotifications(data);
    successHandler(res, { data });
  });
}
