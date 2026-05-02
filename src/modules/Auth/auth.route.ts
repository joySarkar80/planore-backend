import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import auth, { USER_ROLE } from '../../middlewares/auth';

const router = express.Router();

router.post(
    '/register',
    validateRequest(AuthValidation.registerUserValidationSchema),
    AuthControllers.registerUser,
);

router.post(
    '/login',
    validateRequest(AuthValidation.loginValidationSchema),
    AuthControllers.loginUser,
);

router.post(
    '/refresh-token',
    validateRequest(AuthValidation.refreshTokenValidationSchema),
    AuthControllers.refreshToken,
);

router.get(
    '/me',
    auth(USER_ROLE.admin, USER_ROLE.user),
    AuthControllers.getMeHandler,
);

export const AuthRoutes = router;