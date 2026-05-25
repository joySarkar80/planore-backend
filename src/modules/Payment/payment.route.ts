import express from 'express';
import { paymentController } from './payment.controller';
import auth, { USER_ROLE } from '../../middlewares/auth';

const router = express.Router();

router.post(
    '/create-session',
    auth(USER_ROLE.user, USER_ROLE.admin), 
    paymentController.createPaymentSession
);

router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.handleStripeWebhook
);

export const PaymentRoutes = router;