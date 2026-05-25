import { Storage } from '@google-cloud/storage';
import { config } from '@/config';

let bucketInstance: ReturnType<Storage['bucket']> | null = null;

const getStorage = () => {
  if (bucketInstance) return bucketInstance;

  if (!config.gcs.bucketName) {
    throw new Error('GCS_BUCKET_NAME is not defined in environment variables');
  }

  const storage = new Storage({
    credentials: {
      client_email: config.gcs.clientEmail,
      private_key: config.gcs.privateKey,
    },
    projectId: config.gcs.projectId,
  });

  bucketInstance = storage.bucket(config.gcs.bucketName);
  return bucketInstance;
};

export const getBucket = () => getStorage();
