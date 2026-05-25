import httpStatus from 'http-status';
import { TReview } from './review.interface';
import { prisma } from '../../lib/prisma';
import AppError from '../../errors/AppError';

const createReview = async (userId: string, payload: TReview) => {
    
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
        throw new AppError(httpStatus.BAD_REQUEST, 'You are not eligible to review this event. You must have approved join status for the event to leave a review.');
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

const getMyReviews = async (userId: string) => {
    const reviews = await prisma.review.findMany({
        where: { userId },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    startAt: true,
                    venue: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    return reviews;
};

const updateReview = async (userId: string, reviewId: string, payload: { rating?: number; comment?: string }) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId }
    });

    if (!review) {
        throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
    }

    if (review.userId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this review');
    }

    const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: payload,
        include: {
            event: { select: { title: true } }
        }
    });

    return updatedReview;
};

const deleteReview = async (userId: string, reviewId: string) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId }
    });

    if (!review) {
        throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
    }

    if (review.userId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to delete this review');
    }

    const deletedReview = await prisma.review.delete({
        where: { id: reviewId }
    });

    return deletedReview;
};

export const ReviewService = {
    createReview,
    getMyReviews,
    updateReview,
    deleteReview
};