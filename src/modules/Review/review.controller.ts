import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { ReviewService } from './review.service';


const createReviewHandler = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const reviewData = req.body;

    const result = await ReviewService.createReview(userId as string, reviewData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Review submitted successfully',
        data: result,
    });
});

const getMyReviewsHandler = catchAsync(async (req, res) => {
    const userId = req.user?.id; // auth middleware থেকে আসবে
    const result = await ReviewService.getMyReviews(userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reviews retrieved successfully',
        data: result,
    });
});

const getAllEventReviewsHandler = catchAsync(async (req, res) => {
    const { eventId } = req.params;

    const result = await ReviewService.getAllEventReviews(eventId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Event reviews retrieved successfully',
        data: result,
    });
});

const updateReviewHandler = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const { id: reviewId } = req.params;
    const result = await ReviewService.updateReview(userId as string, reviewId as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review updated successfully',
        data: result,
    });
});

const deleteReviewHandler = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const { id: reviewId } = req.params;
    const result = await ReviewService.deleteReview(userId as string, reviewId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review deleted successfully',
        data: result,
    });
});

export const ReviewController = {
    createReviewHandler,
    getMyReviewsHandler,
    getAllEventReviewsHandler,
    updateReviewHandler,
    deleteReviewHandler
};