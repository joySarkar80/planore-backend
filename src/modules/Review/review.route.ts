import express from 'express';
import auth, { USER_ROLE } from '../../middlewares/auth';
import { ReviewController } from './review.controller';

const router = express.Router();


router.post('/', auth(USER_ROLE.user), ReviewController.createReviewHandler);
router.get('/my-reviews', auth(USER_ROLE.user), ReviewController.getMyReviewsHandler);

router.patch('/:id', auth(USER_ROLE.user), ReviewController.updateReviewHandler);
router.delete('/:id', auth(USER_ROLE.user), ReviewController.deleteReviewHandler);

export const ReviewRoutes = router;
