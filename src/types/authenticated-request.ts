import { Request } from 'express';
import { JwtPayload } from '@/utils/jwt.utils';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload['user'];
  backoffice: JwtPayload['backoffice'];
}
