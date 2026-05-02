import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { EventService } from './event.service';

const getAllEventsHandler = catchAsync(async (req: Request, res: Response) => {
    const result = await EventService.getAllEvents(req.query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Events retrieved successfully',
        data: result,
    });
});

const getSingleEventHandler = catchAsync(async (req: Request, res: Response) => {
    const result = await EventService.getSingleEvent(req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Event retrieved successfully',
        data: result,
    });
});

export const EventController = {
    getAllEventsHandler,
    getSingleEventHandler,
};