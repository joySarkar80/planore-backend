import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { registrationService } from "./registration.service";
import httpStatus from "http-status";

const joinEventHandler = catchAsync(async (req, res) => {
    const userId = req.user!.id;
    const { eventId } = req.params;

    const result = await registrationService.joinEvent(eventId as string, userId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message:
            result.registration.status === "APPROVED"
                ? "Joined event successfully"
                : "Join request submitted. Awaiting owner approval.",
        data: result,
    });
});

const payForApprovedPrivateEventHandler = catchAsync(async (req, res) => {
    const userId = req.user!.id;
    const { eventId } = req.params;

    const result = await registrationService.payForApprovedPrivateEvent(eventId as string, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Checkout session created successfully",
        data: result,
    });
});


const inviteUserHandler = catchAsync(async (req, res) => {
    const ownerId = req.user!.id;
    const result = await registrationService.inviteUser(ownerId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User invited successfully",
        data: result,
    });
});

export const registrationController = {
    joinEventHandler,
    inviteUserHandler,
    payForApprovedPrivateEventHandler
}; 