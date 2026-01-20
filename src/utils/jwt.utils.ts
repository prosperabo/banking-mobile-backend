import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { buildLogger } from '@/utils';

const logger = buildLogger('jwt-service');

// Payload para JWT completo (con backoffice)
export interface JwtPayload {
  user?: {
    userId: number;
    email: string;
    username: string;
  };
  backoffice?: BackofficePayload;
  userId?: number;
  email?: string;
  type?: string;
  iat?: number;
  exp?: number;
}

// Payload para token temporal de 2FA
export interface TempTokenPayload {
  userId: number;
  email: string;
  type: '2fa-verification';
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
    username: string;
    backoffice: BackofficePayload;
  }): string {
    try {
      const token = jwt.sign(
        {
          user: {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
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

  static verifyToken(token: string): JwtPayload | TempTokenPayload {
    try {
      const decoded = jwt.verify(token, this.SECRET) as
        | JwtPayload
        | TempTokenPayload;

      // Log based on token type
      if ('type' in decoded && decoded.type === '2fa-verification') {
        logger.info('Temp token verified successfully', {
          userId: decoded.userId,
          email: decoded.email,
        });
      } else if ('user' in decoded && decoded.user) {
        logger.info('JWT token verified successfully', {
          userId: decoded.user.userId,
          email: decoded.user.email,
        });
      }

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
  /**
   * Generates a temporary token for 2FA verification
   * This token has a short duration and only allows verifying the 2FA code
   */
  static generateTempToken(payload: { userId: number; email: string }): string {
    try {
      const token = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          type: '2fa-verification',
        },
        this.SECRET,
        { expiresIn: `${config.twoFactor.tempTokenExpiry}s` } // 10 minutos por defecto
      );

      logger.info('Temp token generated successfully', {
        userId: payload.userId,
        email: payload.email,
      });

      return token;
    } catch (error) {
      logger.error('Error generating temp token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: payload.userId,
      });
      throw new Error('Error generando token temporal');
    }
  }
}
