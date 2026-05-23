import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { featuredEventService } from './featuredEvent.service';

const setFeaturedEventHandler = catchAsync(async (req, res) => {
  const { eventId } = req.body;
  const result = await featuredEventService.setFeaturedEvent(eventId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Featured event set successfully',
    data: result,
  });
});

const getFeaturedEventHandler = catchAsync(async (req, res) => {
  const result = await featuredEventService.getFeaturedEvent();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Featured event retrieved successfully',
    data: result,
  });
});

export const featuredEventController = {
  setFeaturedEventHandler,
  getFeaturedEventHandler,
};