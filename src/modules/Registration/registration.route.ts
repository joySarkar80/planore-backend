import express from "express";
import auth, { USER_ROLE } from "../../middlewares/auth";
import { registrationController } from "./registration.controller";
import { registrationValidation } from "./registration.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// joined events..
router.get(
    '/my-joined-events',
    auth(USER_ROLE.user, USER_ROLE.admin),
    registrationController.getJoinedEventsHandler
);

// who joined..
router.get(
    "/participants",
    auth(USER_ROLE.user, USER_ROLE.admin),
    registrationController.getEventParticipantsHandler
);

// search user for invitation page..
router.get(
    "/search-users",
    auth(USER_ROLE.user, USER_ROLE.admin),
    registrationController.searchUsersForInvitationHandler
);

// who invite for this event..
router.get(
    "/invited",
    auth(USER_ROLE.user, USER_ROLE.admin),
    registrationController.getInvitedUsersByEventHandler
);

// invite user from invitation page..
router.post(
    "/invite",
    auth(USER_ROLE.user, USER_ROLE.admin),
    validateRequest(registrationValidation.inviteUserSchema),
    registrationController.inviteUserHandler
);

// click join button for join events..
router.post(
    "/join/:eventId",
    auth(USER_ROLE.user, USER_ROLE.admin),
    registrationController.joinEventHandler
);

router.post(
    "/pay/:eventId",
    auth(USER_ROLE.user, USER_ROLE.admin),
    registrationController.payForApprovedPrivateEventHandler
);

router.patch(
    "/participants/:id/status",
    auth(USER_ROLE.user, USER_ROLE.admin),
    registrationController.updateParticipantStatusHandler
);

export const registrationRoutes = router;
