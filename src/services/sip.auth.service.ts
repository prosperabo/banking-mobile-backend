/**
 * Manages the SIP JWT token lifecycle.
 * - Obtains a token via POST /autenticacion/v1/generarToken
 * - Caches it in-process for ~55 min (SIP token validity is 1 h)
 * - getToken() / refreshToken() are called by the sip.instance interceptor.
 */
import sipAuthInstance from '@/api/sip.auth.instance';
import { config } from '@/config';
import { buildLogger } from '@/utils';
import { SipGenerateTokenResponseDto } from '@/schemas/sip.schemas';
import { InternalServerError } from '@/shared/errors';

const logger = buildLogger('SipAuthService');

interface TokenCache {
  token: string;
  expiresAt: number; // unix ms
}

let cache: TokenCache | null = null;

export class SipAuthService {
  /** Returns a valid Bearer token, using cache when still valid. */
  static async getToken(): Promise<string> {
    if (cache && cache.expiresAt > Date.now()) {
      return cache.token;
    }
    return SipAuthService.refreshToken();
  }

  /** Invalidates cache and fetches a fresh token from SIP. */
  static async refreshToken(): Promise<string> {
    logger.info('Fetching new SIP token');
    cache = null;

    const response = await sipAuthInstance.post<SipGenerateTokenResponseDto>(
      '/autenticacion/v1/generarToken',
      { username: config.sip.username, password: config.sip.password }
    );

    const body = response.data;

    if (body.codigo !== 'OK' || !body.objeto?.token) {
      // Do NOT log body – may contain sensitive data
      logger.error('SIP token request failed', { codigo: body.codigo });
      throw new InternalServerError(
        `SIP authentication failed: ${body.mensaje}`
      );
    }

    cache = {
      token: body.objeto.token,
      expiresAt: Date.now() + config.sip.tokenCacheTtlSeconds * 1000,
    };

    logger.info('SIP token cached');
    return cache.token;
  }
}
