import express from "express";
import auth, { USER_ROLE } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";

import { eventController } from "./event.controller";
import { eventValidation } from "./event.validation";


const router = express.Router();

// GET /events — browse all approved public events
router.get("/", eventController.getAllEventsHandler);

// GET /events/my-events
// (authenticated user's events)
router.get(
    "/my-events",
    auth(USER_ROLE.user),
    eventController.getMyEventsHandler
);

// GET /events/:id — single event details
router.get("/:id", eventController.getEventByIdHandler);

// POST /events — create a new event
router.post(
    "/",
    auth(USER_ROLE.user),
    validateRequest(eventValidation.createEventSchema),
    eventController.createEventHandler
);

// PATCH /events/:id — update own event
router.patch(
    "/:id",
    auth(USER_ROLE.user),
    validateRequest(eventValidation.updateEventSchema),
    eventController.updateEventHandler
);

// DELETE /events/:id — delete own event
router.delete(
    "/:id",
    auth(USER_ROLE.user),
    eventController.deleteEventHandler
);

router.patch(
    "/status/:id",
    auth(USER_ROLE.admin),
    validateRequest(eventValidation.updateEventStatusSchema),
    eventController.updateEventStatusHandler
);

// DELETE /events/admin/:id — force delete any event
router.delete(
    "/admin/:id",
    auth(USER_ROLE.admin),
    eventController.adminDeleteEventHandler
);

export const EventRoutes = router;