import AppError from "../../errors/AppError";
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

const searchUsersForInvitationHandler = catchAsync(async (req, res) => {
    const ownerId = req.user!.id;
    const { query, eventId } = req.query;

    if (!query || !eventId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Query string and eventId are required parameters");
    }

    const result = await registrationService.searchUsersForInvitation(
        ownerId,
        query as string,
        eventId as string
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users fetched successfully for invitation",
        data: result,
    });
});

const getInvitedUsersByEventHandler = catchAsync(async (req, res) => {
    const ownerId = req.user!.id;
    const { eventId } = req.query;

    if (!eventId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Event ID is required as a query parameter");
    }

    const result = await registrationService.getInvitedUsersByEvent(
        ownerId,
        eventId as string
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Invited guest list retrieved successfully",
        data: result,
    });
});

export const registrationController = {
    joinEventHandler,
    inviteUserHandler,
    payForApprovedPrivateEventHandler,
    searchUsersForInvitationHandler,
    getInvitedUsersByEventHandler,
}; 