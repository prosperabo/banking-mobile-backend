import { Request, Response, NextFunction } from 'express';
import { JwtUtil, TempTokenPayload } from '@/utils/jwt.utils';
import { buildLogger } from '@/utils';

const logger = buildLogger('validateTempToken-middleware');

/**
 * Middleware to validate temporary 2FA tokens
 * These tokens are generated during login when the user has 2FA enabled
 */
export const validateTempToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No temp token provided in request');
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = JwtUtil.verifyToken(token) as TempTokenPayload;

    // Verify that it is a temporary token
    if (!decoded.type || decoded.type !== '2fa-verification') {
      logger.warn('Invalid token type', { type: decoded.type });
      res.status(403).json({ message: 'Invalid token type' });
      return;
    }

    // Attach temporary data to the request
    req.tempUser = {
      userId: decoded.userId,
      email: decoded.email,
    };

    logger.info('Temp token verified successfully', {
      userId: decoded.userId,
    });

    next();
  } catch (error) {
    logger.error('Temp token validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.message === 'Token expirado') {
      res.status(401).json({
        message: 'Verification session expired. Please login again.',
      });
      return;
    }

    res.status(403).json({ message: 'Invalid or expired token' });
  }
};
