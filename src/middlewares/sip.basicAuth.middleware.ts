import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { config } from '@/config';
import { buildLogger } from '@/utils';

const logger = buildLogger('SipBasicAuthMiddleware');

/**
 * Validates HTTP Basic Auth credentials for the SIP callback endpoint.
 * Credentials are loaded from ENV vars `SIP_CALLBACK_BASIC_USER` and
 * `SIP_CALLBACK_BASIC_PASS` – never logged.
 */
export const sipBasicAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'] ?? '';

  if (!authHeader.startsWith('Basic ')) {
    logger.warn('SIP basic auth: missing or non-basic Authorization header');
    res.status(StatusCodes.UNAUTHORIZED).json({
      codigo: '4010',
      mensaje: 'Unauthorized',
    });
    return;
  }

  const base64 = authHeader.slice('Basic '.length);
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const colonIndex = decoded.indexOf(':');

  if (colonIndex === -1) {
    logger.warn('SIP basic auth: malformed credentials');
    res.status(StatusCodes.UNAUTHORIZED).json({
      codigo: '4010',
      mensaje: 'Unauthorized',
    });
    return;
  }

  const user = decoded.slice(0, colonIndex);
  const pass = decoded.slice(colonIndex + 1);

  const expectedUser = config.sip.callbackBasicUser;
  const expectedPass = config.sip.callbackBasicPass;

  // Constant-time comparison to avoid timing attacks
  const userMatch = timingSafeEqual(user, expectedUser);
  const passMatch = timingSafeEqual(pass, expectedPass);

  if (!userMatch || !passMatch) {
    // Do NOT log actual credentials
    logger.warn('SIP basic auth: invalid credentials attempt');
    res.status(StatusCodes.UNAUTHORIZED).json({
      codigo: '4010',
      mensaje: 'Unauthorized',
    });
    return;
  }

  next();
};

/** Constant-time string comparison */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
