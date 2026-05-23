import { Router } from 'express';
import auth, { USER_ROLE } from '../../middlewares/auth';
import { featuredEventController } from './featuredEvent.controller';

const router = Router();

router.get('/', featuredEventController.getFeaturedEventHandler);
router.post('/', auth(USER_ROLE.admin), featuredEventController.setFeaturedEventHandler);

export const featuredEventRoutes = router;