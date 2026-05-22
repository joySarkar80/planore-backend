import httpStatus from 'http-status';
import { TReview } from './review.interface';
import { prisma } from '../../lib/prisma';
import AppError from '../../errors/AppError';

export const createReviewService = async (userId: string, payload: TReview) => {
    
    const registration = await prisma
    .registration.findUnique({
        where: {
            eventId_userId: {
                eventId: payload.eventId,
                userId: userId,
            },
        },
    });

    if (!registration || registration.status !== 'APPROVED') {
        throw new AppError(httpStatus.BAD_REQUEST, 'You can only review events you have been approved for.');
    }

    
    const existingReview = await prisma.review.findUnique({
        where: {
            eventId_userId: {
                eventId: payload.eventId,
                userId: userId,
            },
        },
    });

    if (existingReview) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You have already reviewed this event.');
    }

    
    const newReview = await prisma.review.create({
        data: {
            eventId: payload.eventId,
            userId: userId,
            rating: payload.rating,
            comment: payload.comment,
        },
    });

    return newReview;
};