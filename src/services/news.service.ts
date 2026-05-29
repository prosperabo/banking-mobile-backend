import { buildLogger } from '@/utils';
import { NotFoundError } from '@/shared/errors';
import {
  GetNewsQueryDto,
  NewsDto,
  CreateNewsBodyDto,
  CreateNewsQueryDto,
  NoveltyResponseItemDto,
} from '@/schemas/news.schemas';
import { NewsRepository } from '@/repositories/news.repository';
import { MulterFile } from '@/types/muterFile';
import { uploadToGCS } from '@/utils/storage.util';

const logger = buildLogger('NewsService');

export class NewsService {
  static async getNews(
    query: GetNewsQueryDto
  ): Promise<NoveltyResponseItemDto[]> {
    const rawNews = await NewsRepository.findAllByAppVersion(query.appVersion);
    logger.info(
      `Fetched ${rawNews.length} news notifications for app version ${query.appVersion}`
    );
    const items: NoveltyResponseItemDto[] = rawNews.map(news => {
      return {
        id: news.id,
        title: news.title,
        description: news.description,
        image_url: news.imageUrl ?? '',
        redirect_url: news.redirectUrl ?? '',
        app_version: news.appVersion ?? query.appVersion ?? '',
        published_at: news.publishedAt,
        is_active: news.published,
      };
    });
    return items;
  }

  static async createNews(
    body: CreateNewsBodyDto,
    file: MulterFile | undefined,
    query: CreateNewsQueryDto
  ): Promise<NewsDto> {
    const imageUrl = file ? await uploadToGCS(file) : undefined;
    logger.info('News created with image URL', { imageUrl });
    return NewsRepository.create(body, imageUrl, query.appVersion);
  }

  static async publishNews(id: string): Promise<NewsDto> {
    const news = await NewsRepository.findById(id);
    if (!news) {
      throw new NotFoundError(`News with id ${id} not found`);
    }
    const published = await NewsRepository.publish(id);
    logger.info(`Announcement ${id} published and sent via FCM`);
    return published;
  }
}
