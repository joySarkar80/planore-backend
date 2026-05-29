import AppError from "../../errors/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { registrationService } from "./registration.service";
import httpStatus from "http-status";

const joinEventHandler = catchAsync(async (req, res) => {
    const userId = req.user!.id;
    const { eventId } = req.params;

    const result = await registrationService.joinEvent(eventId as string, userId);

    let message = "Join request submitted. Awaiting owner approval.";
    if (result.registration?.status === "APPROVED") {
        message = "Joined event successfully";
    } else if (!result.registration && result.checkoutUrl) {
        message = "Please complete the payment to finalize your registration.";
    }

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message,
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

const getEventParticipantsHandler = catchAsync(async (req, res) => {
    const ownerId = req.user!.id;
    const { eventId } = req.query;

    if (!eventId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Event ID is required");
    }

    const result = await registrationService.getEventParticipants(ownerId, eventId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Participants list and single event retrieved successfully",
        data: result,
    });
});

const updateParticipantStatusHandler = catchAsync(async (req, res) => {
    const ownerId = req.user!.id;
    const { id } = req.params; // registrationId
    const { status } = req.body;

    if (!status) {
        throw new AppError(httpStatus.BAD_REQUEST, "Status is required in request body");
    }

    const result = await registrationService.updateParticipantStatus(ownerId, id as string, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Participant status updated to ${status} successfully`,
        data: result,
    });
});

const getJoinedEventsHandler = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const queryFilter = req.query.filter as string;

    const filter = ['ALL EVENTS', 'UPCOMING', 'PAST'].includes(queryFilter)
        ? (queryFilter as 'ALL EVENTS' | 'UPCOMING' | 'PAST')
        : 'ALL EVENTS';

    const result = await registrationService.getJoinedEventsForUser(
        userId as string,
        filter
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Joined events retrieved successfully',
        data: result,
    });
});

const deleteRegistrationHandler = catchAsync(async (req, res) => {
    const ownerId = req.user?.id;
    const { registrationId } = req.params;
    const result = await registrationService.deleteRegistration(ownerId as string, registrationId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Registration deleted successfully',
        data: result,
    });
});


export const registrationController = {
    joinEventHandler,
    inviteUserHandler,
    payForApprovedPrivateEventHandler,
    searchUsersForInvitationHandler,
    getInvitedUsersByEventHandler,
    getEventParticipantsHandler,
    updateParticipantStatusHandler,
    getJoinedEventsHandler,
    deleteRegistrationHandler
}; 