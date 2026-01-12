import crypto from 'crypto';
import { config } from '@/config';

const ALGORITHM = 'aes-256-cbc';

/**
 * Generates a 32-byte encryption key from a string
 */
function getEncryptionKey(): Buffer {
  const key = config.twoFactor.encryptionKey;

  // If the key is less than 32 bytes, hash it with SHA-256
  if (key.length < 32) {
    return crypto.createHash('sha256').update(key).digest();
  }

  // If it's longer, take only the first 32 bytes
  return Buffer.from(key.slice(0, 32));
}

/**
 * Encrypts a text using AES-256-CBC
 * @param text - Text to encrypt
 * @returns Encrypted text in the format: iv:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // Initialization vector

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data separated by ':'
    return `${iv.toString('hex')}:${encrypted}`;
  } catch {
    throw new Error('Error encrypting data');
  }
}

/**
 * Decrypts a text encrypted with AES-256-CBC
 * @param encryptedText - Encrypted text in the format: iv:encryptedData
 * @returns Decrypted text
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    throw new Error('Error decrypting data');
  }
}
