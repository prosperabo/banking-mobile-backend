import { firebaseMessaging } from '@/config/firebase';
import { buildLogger } from '@/utils';
import { NotFoundError } from '@/shared/errors';
import {
  GetNewsQueryDto,
  NewsDto,
  CreateNewsBodyDto,
  CreateNewsQueryDto,
  FirebaseAnnouncementPayloadDto,
} from '@/schemas/news.schemas';
import { NewsRepository } from '@/repositories/news.repository';
import { MulterFile } from '@/types/muterFile';
import { uploadToGCS } from '@/utils/storage.util';

const logger = buildLogger('NewsService');

export class NewsService {
  static async getNews(query: GetNewsQueryDto): Promise<NewsDto[]> {
    const news = await NewsRepository.findAllByAppVersion(query.appVersion);
    logger.info(
      `Fetched ${news.length} news notifications for app version ${query.appVersion}`
    );
    return news;
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

    const payload: FirebaseAnnouncementPayloadDto = {
      data: {
        type: 'announcement',
        announcement_id: published.id,
        title: published.title,
        description: published.description,
        ...(published.imageUrl && { image_url: published.imageUrl }),
        ...(published.redirectUrl && { redirect_url: published.redirectUrl }),
      },
    };

    await firebaseMessaging.send({
      topic: 'announcements',
      data: { ...payload.data },
    });
    logger.info(`Announcement ${id} published and sent via FCM`);

    return published;
  }
}
