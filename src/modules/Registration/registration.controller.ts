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
            result.status === "APPROVED"
                ? "Joined event successfully"
                : "Join request submitted. Awaiting owner approval.",
        data: result,
    });
});

export const registrationController = {
    joinEventHandler,
};  