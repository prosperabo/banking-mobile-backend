import crypto from 'crypto';

/**
 * Creates a SHA256 hash of the provided password
 * @param password - Plain text password
 * @returns SHA256 hex digest of the password
 */
export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generates a unique device ID for the user
 * @param userId - User ID
 * @returns Formatted device ID string
 */
export function generateDeviceId(userId: number): string {
    return `device_${userId}_${Date.now()}`;
}
