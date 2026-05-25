import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import {
    updateUserValidationSchema,
} from './user.validation';
import auth, { USER_ROLE } from '../../middlewares/auth';

const router = express.Router();

// ==========================================
// 1. STATIC / SPECIFIC ROUTES 
// ==========================================

router.get(
    '/all',
    auth(USER_ROLE.admin),
    UserController.adminGetAllUsersHandler
);

router.get(
    '/me',
    auth(USER_ROLE.user, USER_ROLE.admin),
    UserController.getMyProfileHandler,
);

router.patch(
    '/me',
    auth(USER_ROLE.user),
    validateRequest(updateUserValidationSchema),
    UserController.updateUserByIdHandler,
);


// ==========================================
// 2. DYNAMIC ROUTES 
// ==========================================

router.patch(
    '/:userId/status',
    auth(USER_ROLE.admin),
    UserController.updateUserStatusHandler
);

router.get(
    '/:id',
    auth(USER_ROLE.admin, USER_ROLE.user),
    UserController.findUserByIdHandler,
);

router.delete(
    '/:id',
    auth(USER_ROLE.admin),
    UserController.deleteUserByIdHandler
);

export const UserRoutes = router;