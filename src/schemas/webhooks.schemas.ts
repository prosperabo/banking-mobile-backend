export interface BulkOrderCardNotification {
  numCreated: number;
  numFailed: number;
  referenceBatch: string;
  status: number;
  cards?: Array<{
    card_identifier: string;
    card_id?: number;
    status?: number;
  }>;
}
