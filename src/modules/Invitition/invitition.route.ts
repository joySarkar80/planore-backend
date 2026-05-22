import express from "express";
import auth, { USER_ROLE } from '../../middlewares/auth';
import { InvititionController } from './invitition.controller';
const router = express.Router();

// শুধু ইউজাররা তাদের ইনভাইটেশন দেখতে এবং রেসপন্স করতে পারবে
router.get('/my-invitations', auth(USER_ROLE.user), InvititionController.getMyInvitationsHandler);

router.patch(
  '/:id/respond',
  auth(USER_ROLE.user),
  InvititionController.respondToInvitationHandler
);

export const InvititionRoutes = router;