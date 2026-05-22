import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { createReviewService } from './review.service';

export const createReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const reviewData = req.body;

    const result = await createReviewService(userId as string, reviewData);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Review submitted successfully',
        data: result,
    });
});