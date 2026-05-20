import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { eventService } from "./event.service";
import { IEventFilters } from "./event.interface";
import { EventStatus, EventVisibility } from "../../../generated/prisma/enums";

const getAllEventsHandler = catchAsync(async (req, res) => {
    const filters: IEventFilters = {
        search: req.query.search as string | undefined,
        visibility: req.query.visibility as EventVisibility | undefined,
        isFree: req.query.isFree as string | undefined,
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
    };

    const result = await eventService.getAllEvents(filters);

    sendResponse(res, {
        statusCode: 200, // httpStatus.OK
        success: true,
        message: "Events retrieved successfully",
        meta: {
            page: result.meta.page,
            limit: result.meta.limit,
            total: result.meta.total,
            totalPage: result.meta.totalPages,
        },
        data: result.data
    });
});

const getEventByIdHandler = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await eventService.getEventById(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event details retrieved successfully",
        data: result,
    });
});

// ─────────────────────────────────────────────
// USER CONTROLLERS
// ─────────────────────────────────────────────

const createEventHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const result = await eventService.createEvent(req.user.id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Event created successfully. Awaiting admin approval.",
        data: result,
    });
});

const updateEventHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;

    const result = await eventService.updateEvent(id as string, req.user.id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event updated successfully",
        data: result,
    });
});

const deleteEventHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const { id } = req.params;

    const result = await eventService.deleteEvent(id as string, req.user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getMyEventsHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const filters = {
        search: req.query.search as string | undefined,
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
    };

    const result = await eventService.getMyEvents(req.user.id, filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My events retrieved successfully",
        data: result.data,
    });
});

// ─────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────

const updateEventStatusHandler = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(EventStatus).includes(status)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid event status");
    }

    const result = await eventService.updateEventStatus(id as string, { status });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Event ${status.toLowerCase()} successfully`,
        data: result,
    });
});

const adminDeleteEventHandler = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await eventService.adminDeleteEvent(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const eventController = {
    getAllEventsHandler,
    getEventByIdHandler,
    createEventHandler,
    updateEventHandler,
    deleteEventHandler,
    getMyEventsHandler,
    updateEventStatusHandler,
    adminDeleteEventHandler,
};