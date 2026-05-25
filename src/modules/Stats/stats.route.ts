import express from 'express';
import auth, { USER_ROLE } from '../../middlewares/auth';
import { StatsController } from './stats.controller';

const router = express.Router();

router.get(
    '/stats',
    auth(USER_ROLE.admin, USER_ROLE.user),
    StatsController.getDashboardStats
);

export const StatsRoutes = router;