import { JwtPayload } from '@/utils/jwt.utils';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload['user'];
    backoffice?: JwtPayload['backoffice'];
  }
}
