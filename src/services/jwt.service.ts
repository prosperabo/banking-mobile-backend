import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { buildLogger } from '@/shared/utils';

const logger = buildLogger('jwt-service');

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export class JwtService {
  private static readonly SECRET = config.jwt.secret;
  private static readonly EXPIRES_IN = config.jwt.expiresIn;

  static generateToken(payload: { userId: number; email: string }): string {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
        },
        this.SECRET,
        { expiresIn: '24h' }
      );

      logger.info('JWT token generated successfully', {
        userId: payload.userId,
        email: payload.email,
      });

      return token;
    } catch (error) {
      logger.error('Error generating JWT token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: payload.userId,
      });
      throw new Error('Error generando token JWT');
    }
  }

  static verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.SECRET) as JwtPayload;

      logger.info('JWT token verified successfully', {
        userId: decoded.userId,
        email: decoded.email,
      });

      return decoded;
    } catch (error) {
      logger.error('Error verifying JWT token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      } else {
        throw new Error('Error verificando token JWT');
      }
    }
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error('Error decoding JWT token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}
