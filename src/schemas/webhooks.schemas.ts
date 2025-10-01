export interface BulkOrderCardNotification {
  numCreated: number;
  numFailed: number;
  referenceBatch: string;
  status: number;
}
