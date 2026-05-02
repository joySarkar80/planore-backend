import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { IEventFilter, IEventResponse } from './event.interface';

const getAllEvents = async (
    query: IEventFilter
): Promise<IEventResponse[]> => {
    const { searchTerm, visibility } = query;

    const whereCondition: any = {
        status: 'APPROVED',
        visibility: 'PUBLIC',
    };

    // 🔍 Search প্রয়োগ
    if (searchTerm) {
        whereCondition.OR = [
            {
                title: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            {
                owner: {
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            },
        ];
    }

    if (visibility) {
        whereCondition.visibility = visibility;
    }

    const result = await prisma.event.findMany({
        where: whereCondition,
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            startAt: 'asc',
        },
    });

    return result;
};

const getSingleEvent = async (id: string): Promise<IEventResponse> => {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                },
            },
            reviews: true,
        },
    });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
    }

    return event;
};

export const EventService = {
    getAllEvents,
    getSingleEvent,
};