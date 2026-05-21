import express from "express";
import auth, { USER_ROLE } from "../../middlewares/auth";
import { registrationController } from "./registration.controller";
import { registrationValidation } from "./registration.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.get('/my-joined-events', auth(USER_ROLE.user), registrationController.getJoinedEventsHandler);
router.get("/participants", auth(USER_ROLE.user), registrationController.getEventParticipantsHandler);
router.get("/search-users", auth(USER_ROLE.user), registrationController.searchUsersForInvitationHandler);
router.get("/invited", auth(USER_ROLE.user), registrationController.getInvitedUsersByEventHandler);

router.post(
    "/invite",
    auth(USER_ROLE.user),
    validateRequest(registrationValidation.inviteUserSchema),
    registrationController.inviteUserHandler
);

router.post(
    "/join/:eventId",
    auth(USER_ROLE.user),
    registrationController.joinEventHandler
);

router.post(
    "/pay/:eventId",
    auth(USER_ROLE.user),
    registrationController.payForApprovedPrivateEventHandler
);

router.patch(
    "/participants/:id/status",
    auth(USER_ROLE.user),
    registrationController.updateParticipantStatusHandler
);

export const registrationRoutes = router;
