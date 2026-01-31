import { Router } from 'express';

import { UserController } from '@/controllers/user.controller';
import { CampaignController } from '@/controllers/campaign.controller';
import {
  updateUserValidator,
  changePasswordValidator,
  addAliasValidator,
} from '@/validators/user.validator';
import { assignUsersToProgramValidator } from '@/validators/campaign.validator';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticateToken } from '@/middlewares/authenticateToken';

const router = Router();

router.use(authenticateToken);
router.get('/', UserController.getUser);
router.put(
  '/',
  validateRequest(...updateUserValidator),
  UserController.updateUser
);
router.put(
  '/password',
  validateRequest(...changePasswordValidator),
  UserController.changePassword
);
router.put(
  '/alias',
  validateRequest(...addAliasValidator),
  UserController.addAlias
);
router.post(
  '/programs/assign',
  validateRequest(...assignUsersToProgramValidator),
  CampaignController.assignUserToProgram
);

export default router;
