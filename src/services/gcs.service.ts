import { getBucket, config } from '@/config';
import { MulterFile } from '@/types/muterFile';
import { buildLogger } from '@/utils';

const logger = buildLogger('GcsService');

export class GcsService {
  static async uploadToGCS(file: MulterFile): Promise<string> {
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
  }
}
