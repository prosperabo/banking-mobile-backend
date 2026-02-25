/**
 * SipBmscService
 *
 * Handles all outbound HTTP communication with the SIP payments API.
 * This is the only service that imports sipInstance or SipAuthService.
 *
 * Responsibilities:
 *  - Obtain / refresh the Bearer token via SipAuthService
 *  - Inject the Authorization header and call sipInstance
 *  - Retry once on 401 with a fresh token
 *  - Map raw SIP responses to typed domain objects
 */
import sipInstance from '@/api/sip.instance';
import { SipAuthService } from '@/services/sip.auth.service';
import { buildLogger } from '@/utils';
import {
  SipGenerateQrRequestDto,
  SipGenerateQrResponseDto,
  SipQrObjeto,
} from '@/schemas/sip.schemas';
import { UnauthorizedError } from '@/shared/errors';

const logger = buildLogger('SipBmscService');

export class SipBmscService {
  /**
   * Execute a SIP API call using the current cached token.
   * On 401 (token expired), invalidates the cache, fetches a fresh token,
   * and retries the call exactly once.
   */
  private static async withToken<T>(
    fn: (token: string) => Promise<T>
  ): Promise<T> {
    const token = await SipAuthService.getToken();
    try {
      return await fn(token);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logger.warn('SIP returned 401 - refreshing token and retrying');
        const freshToken = await SipAuthService.refreshToken();
        return fn(freshToken);
      }
      throw err;
    }
  }

  /**
   * Calls SIP POST /api/v1/generaQr and returns the QR data object.
   * Throws InternalServerError if SIP rejects the request or returns no data.
   */
  static async generateQr(
    request: SipGenerateQrRequestDto
  ): Promise<SipQrObjeto> {
    logger.info('Requesting QR generation from SIP', { alias: request.alias });

    const body = await SipBmscService.withToken(async token => {
      const response = await sipInstance.post<SipGenerateQrResponseDto>(
        '/api/v1/generaQr',
        request,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    });

    logger.info('SIP QR generation successful', {
      alias: request.alias,
      idQr: body.objeto.idQr,
    });

    return body.objeto;
  }
}
