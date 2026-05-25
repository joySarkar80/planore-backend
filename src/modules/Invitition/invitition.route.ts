import express from "express";
import auth, { USER_ROLE } from '../../middlewares/auth';
import { InvititionController } from './invitition.controller';
const router = express.Router();

router.get('/my-invitations', auth(USER_ROLE.user, USER_ROLE.admin), InvititionController.getMyInvitationsHandler);

router.patch(
  '/:id/respond',
  auth(USER_ROLE.user, USER_ROLE.admin),
  InvititionController.respondToInvitationHandler
);

export const InvititionRoutes = router;