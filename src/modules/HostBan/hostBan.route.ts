import express from 'express';
import auth, { USER_ROLE } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { hostBanController } from './hostBan.controller';
import { banUserSchema } from './hostBan.validation';

const router = express.Router();

router.post('/ban',
    auth(USER_ROLE.user, USER_ROLE.admin),
    validateRequest(banUserSchema),
    hostBanController.banUser);


router.delete('/unban/:userId',
    auth(USER_ROLE.user, USER_ROLE.admin),
    hostBanController.unbanUser);


router.get('/banned-users',
    auth(USER_ROLE.user, USER_ROLE.admin),
    hostBanController.getBannedUsers);


export const hostBanRoutes = router;