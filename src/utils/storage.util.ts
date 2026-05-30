import { buildLogger } from '@/utils';
import { config } from '@/config';
import { getBucket } from '@/config/gcp';
import { MulterFile } from '@/types/muterFile';

const logger = buildLogger('StorageConfig');

export const uploadToGCS = async (file: MulterFile): Promise<string> => {
  const filename = `news/${Date.now()}-${file.originalname}`;
  const blob = getBucket().file(filename);
  await new Promise<void>((resolve, reject) => {
    const stream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(file.buffer);
  });
  const publicUrl = `https://storage.googleapis.com/${config.gcpBucket.bucketName}/${filename}`;
  logger.info(`File uploaded to GCS: ${publicUrl}`);
  return publicUrl;
};
