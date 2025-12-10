import { buildLogger } from '@/utils';

const logger = buildLogger('InspirationService');

export interface DailyInspirationResponse {
  quote: string;
  author: string;
  imageUrl: string;
}

const MOCK_INSPIRATIONS: DailyInspirationResponse[] = [
  {
    quote: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    imageUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  },
  {
    quote:
      'You will face many defeats in life, but never let yourself be defeated.',
    author: 'Maya Angelou',
    imageUrl:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop',
  },
  {
    quote: 'Whatever the mind of man can conceive and believe, it can achieve.',
    author: 'Napoleon Hill',
    imageUrl:
      'https://images.unsplash.com/photo-1764957080878-3f9866270aad?q=80&w=687&auto=format&fit=crop',
  },
];

export class InspirationService {
  static async getDailyInspiration(): Promise<DailyInspirationResponse> {
    logger.info('Fetching daily inspiration');
    const randomIndex = Math.floor(Math.random() * MOCK_INSPIRATIONS.length);
    const inspiration = MOCK_INSPIRATIONS[randomIndex];
    logger.info('Daily inspiration fetched', { author: inspiration.author });
    return inspiration;
  }
}
