import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import {
    createUserValidationSchema,
    updateUserValidationSchema,
} from './user.validation';
import auth, { USER_ROLE } from '../../middlewares/auth';


const router = express.Router();

// Specific Routes 
router.patch(
    '/me',
    auth(USER_ROLE.user),
    validateRequest(updateUserValidationSchema),
    UserController.updateUserByIdHandler,
);

// General Resource Routes
router.get('/', auth(USER_ROLE.admin), UserController.getAllUsersHandler);


// Dynamic routes
router.get(
    '/:id',
    auth(USER_ROLE.admin, USER_ROLE.user),
    UserController.findUserByIdHandler,
);

router.delete('/:id', auth(USER_ROLE.admin), UserController.deleteUserByIdHandler);

export const UserRoutes = router;
