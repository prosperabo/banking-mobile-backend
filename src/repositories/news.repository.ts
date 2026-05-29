import {
  CreateNewsBodyDto,
  NewsDto,
  NoveltiesResponseDto,
  NoveltyResponseItemDto,
} from '@/schemas/news.schemas';
import { firebaseDB } from '@/config/gcp';
import { Filter } from 'firebase-admin/firestore';
import { ulid } from 'ulid';

const COLLECTION = 'news';

export class NewsRepository {
  static async findAllByAppVersion(appVersion?: string): Promise<NewsDto[]> {
    const snapshot = await firebaseDB
      .collection(COLLECTION)
      .where('appVersion', '==', appVersion)
      .where('published', '==', true)
      .get();
    let items = snapshot.docs.map(doc => doc.data() as NewsDto);
    if (appVersion) {
      items = items.filter(news => news.appVersion === appVersion);
    }
    items.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return items;
  }

  static async findNoveltiesByAppVersion(
    appVersion: string
  ): Promise<NoveltiesResponseDto> {
    const queryFilter = Filter.and(
      Filter.where('published', '==', true),
      Filter.where('appVersion', '==', appVersion)
    );

    const snapshot = await firebaseDB
      .collection(COLLECTION)
      .where(queryFilter)
      .get();

    const items: NoveltyResponseItemDto[] = snapshot.docs.map(doc => {
      const news = doc.data() as NewsDto;

      return {
        id: doc.id || news.id,
        title: news.title,
        description: news.description,
        image_url: news.imageUrl ?? '',
        redirect_url: news.redirectUrl ?? '',
        app_version: news.appVersion ?? appVersion,
        published_at: news.publishedAt,
        is_active: true,
      };
    });

    items.sort((a, b) => {
      const dateA = NewsRepository.getPublishedAtTime(a.published_at);
      const dateB = NewsRepository.getPublishedAtTime(b.published_at);
      return dateB - dateA;
    });

    return {
      app_version: appVersion,
      items,
    };
  }

  private static getPublishedAtTime(publishedAt: unknown): number {
    if (
      publishedAt &&
      typeof publishedAt === 'object' &&
      'toDate' in (publishedAt as { toDate?: unknown }) &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      typeof (publishedAt as { toDate: Function }).toDate === 'function'
    ) {
      return (publishedAt as { toDate: () => Date }).toDate().getTime();
    }
    return new Date(publishedAt as string | number).getTime();
  }

  static async create(
    body: CreateNewsBodyDto,
    imageUrl: string | undefined,
    appVersion: string | undefined
  ): Promise<NewsDto> {
    const now = new Date().toISOString();
    const id = ulid();
    const news: NewsDto = {
      id,
      title: body.title,
      description: body.description,
      imageUrl: imageUrl ?? '',
      redirectUrl: body.redirectUrl ?? '',
      appVersion,
      published: false,
      createdAt: now,
      updatedAt: now,
    };
    await firebaseDB.collection(COLLECTION).doc(id).set(news);
    return news;
  }

  static async findById(id: string): Promise<NewsDto | null> {
    const doc = await firebaseDB.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as NewsDto;
  }

  static async publish(id: string): Promise<NewsDto> {
    const now = new Date().toISOString();
    const ref = firebaseDB.collection(COLLECTION).doc(id);
    await ref.update({ published: true, publishedAt: now, updatedAt: now });
    const updated = await ref.get();
    return updated.data() as NewsDto;
  }
}
