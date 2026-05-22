import express from 'express';
import auth, { USER_ROLE } from '../../middlewares/auth';
import { createReview } from './review.controller';

const router = express.Router();

router.post(
    '/',
    auth(USER_ROLE.user),
    createReview
);

export const ReviewRoutes = router;