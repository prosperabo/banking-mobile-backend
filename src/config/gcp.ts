import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import { config } from '@/config';

let bucketInstance: ReturnType<Storage['bucket']> | null = null;
let firestoreInstance: Firestore | null = null;

const getStorage = () => {
  if (bucketInstance) return bucketInstance;

  if (!config.gcp.bucketName) {
    throw new Error('GCP_BUCKET_NAME is not defined in environment variables');
  }

  const storage = new Storage({
    credentials: {
      client_email: config.gcp.clientEmail,
      private_key: config.gcp.privateKey,
    },
    projectId: config.gcp.projectId,
  });

  bucketInstance = storage.bucket(config.gcp.bucketName);
  return bucketInstance;
};

const getFirestore = (): Firestore => {
  if (firestoreInstance) return firestoreInstance;

  firestoreInstance = new Firestore({
    credentials: {
      client_email: config.gcp.clientEmail,
      private_key: config.gcp.privateKey,
    },
    projectId: config.gcp.projectId,
  });

  return firestoreInstance;
};

export const getBucket = () => getStorage();
export const firebaseDB = getFirestore();
