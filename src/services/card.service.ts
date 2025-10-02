import { CardRepository } from '@/repositories/card.repository';
import { formatMaskedNumber } from '@/utils/card.utils';

export class CardService {
  static async getUserCards(userId: number) {
    const cards = await CardRepository.getUserCards(userId);

    return cards.map(card => ({
      ...card,
      maskedNumber: formatMaskedNumber(card.maskedNumber || ''),
    }));
  }
}
