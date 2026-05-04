import express from "express";
import auth, { USER_ROLE } from "../../middlewares/auth";
import { registrationController } from "./registration.controller";
import { registrationValidation } from "./registration.validation";
import validateRequest from "../../middlewares/validateRequest";



const router = express.Router();

router.post(
    "/join/:eventId",
    auth(USER_ROLE.user),
    registrationController.joinEventHandler
);

export const registrationRoutes = router;