import { Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt.utils';
import { buildLogger } from '@/utils';
import { AuthenticatedRequest } from '@/types/authenticated-request';

const logger = buildLogger('auth-middleware');

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided in request');
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = JwtUtil.verifyToken(token);

    req.user = decoded.user;
    req.backoffice = decoded.backoffice;

    logger.info('Token verified and user data attached to request', {
      userId: decoded.user.userId,
      email: decoded.user.email,
    });

    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.message === 'Token expired') {
      res.status(401).json({ message: 'Token expired' });
      return;
    }

    res.status(403).json({ message: 'Invalid token' });
  }
};
