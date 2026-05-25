import { ulid } from 'ulid';
import { CreateNewsBodyDto, NewsDto } from '@/schemas/news.schemas';
import { firebaseDB } from '@/config/firebase';

const COLLECTION = 'news';

export class NewsRepository {
  static async findAllByAppVersion(appVersion?: string): Promise<NewsDto[]> {
    let query = firebaseDB
      .collection(COLLECTION)
      .where('published', '==', true)
      .orderBy('publishedAt', 'desc');

    if (appVersion) {
      query = query.where('appVersion', '==', appVersion) as typeof query;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as NewsDto);
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
      imageUrl,
      redirectUrl: body.redirectUrl,
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
