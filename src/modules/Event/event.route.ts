import express from "express";
import auth, { USER_ROLE } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";

import { eventController } from "./event.controller";
import { eventValidation } from "./event.validation";

const router = express.Router();

// ==========================================
// 1. ADMIN ROUTES 
// ==========================================
router.get('/admin', auth(USER_ROLE.admin), eventController.adminGetAllEventsHandler);

router.patch(
    "/:id/status",
    auth(USER_ROLE.admin),
    validateRequest(eventValidation.updateEventStatusSchema), 
    eventController.updateEventStatusHandler
);

router.delete(
    "/admin/:id",
    auth(USER_ROLE.admin),
    eventController.adminDeleteEventHandler
);

// ==========================================
// 2. STATIC ROUTES 
// ==========================================
router.get("/", eventController.getAllEventsHandler);

// this route is for both users and admins to get their own events (created by them)
router.get(
    "/my-events",
    auth(USER_ROLE.user, USER_ROLE.admin), 
    eventController.getMyEventsHandler
);

// ==========================================
// 3. DYNAMIC ROUTES 
// ==========================================

// GET /events/:id — single event details
router.get("/:id", eventController.getEventByIdHandler);

// POST /events — create a new event
router.post(
    "/",
    auth(USER_ROLE.user, USER_ROLE.admin),
    validateRequest(eventValidation.createEventSchema),
    eventController.createEventHandler
);

// PATCH /events/:id — update own event
router.patch(
    "/:id",
    auth(USER_ROLE.user, USER_ROLE.admin),
    validateRequest(eventValidation.updateEventSchema),
    eventController.updateEventHandler
);

// DELETE /events/:id — delete own event
router.delete(
    "/:id",
    auth(USER_ROLE.user, USER_ROLE.admin),
    eventController.deleteEventHandler
);

export const EventRoutes = router;
