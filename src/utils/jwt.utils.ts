import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { buildLogger } from '@/utils';

const logger = buildLogger('jwt-service');

export interface JwtPayload {
  user: {
    userId: number;
    email: string;
  };
  backoffice: BackofficePayload;
  iat?: number;
  exp?: number;
}

export interface BackofficePayload {
  customer_oauth_token: string;
  expiration_timestamp: string;
  customer_refresh_token: string;
  refresh_expiration_timestamp: string;
  client_state_ret: number;
  customerId: number;
}

export class JwtUtil {
  private static readonly SECRET = config.jwt.secret;
  private static readonly EXPIRES_IN = config.jwt.expiresIn;

  static generateToken(payload: {
    userId: number;
    email: string;
    backoffice: BackofficePayload;
  }): string {
    try {
      const token = jwt.sign(
        {
          user: {
            userId: payload.userId,
            email: payload.email,
          },
          backoffice: payload.backoffice,
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
        userId: decoded.user.userId,
        email: decoded.user.email,
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
