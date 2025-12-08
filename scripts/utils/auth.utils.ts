/**
 * @fileoverview Authentication utilities for user credential management
 * @description Provides functions for password hashing and device ID generation
 */

import * as crypto from 'crypto';

/**
 * Creates a SHA256 hash of the provided password
 * @param password - Plain text password to hash
 * @returns SHA256 hex digest of the password
 */
export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generates a unique device ID for the user
 * @param userId - The unique identifier of the user
 * @returns Formatted device ID string with timestamp
 */
export function generateDeviceId(userId: number): string {
    return `device_${userId}_${Date.now()}`;
}
