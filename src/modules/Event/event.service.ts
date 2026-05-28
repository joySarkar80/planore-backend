
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
    IAdminEventFilters,
    ICreateEvent,
    IEventFilters,
    IMyEventFilters,
    IUpdateEvent,
    IUpdateEventStatus,
} from "./event.interface";
import { EventStatus, EventVisibility, Prisma, RegistrationPaymentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { JoinStatus } from "../../../generated/prisma/enums";

// get all events for events page and slider..
const getAllEvents = async (filters: IEventFilters) => {
    const {
        search,
        visibility,
        isFree,
        page = "1",
        limit = "10",
        upcoming
    } = filters;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.EventWhereInput[] = [
        { status: EventStatus.APPROVED }
    ];

    // Visibility Filter (Public / Private)
    if (visibility) {
        andConditions.push({ visibility: visibility });
    }

    if (isFree === "true") {
        andConditions.push({ registrationFee: { equals: 0 } });
    } else if (isFree === "false") {
        andConditions.push({ registrationFee: { gt: 0 } });
    }

    // Upcoming filter — 
    if (upcoming === 'true') {
        andConditions.push({ startAt: { gte: new Date() } });
    }

    // Title / Organizer Search
    if (search) {
        andConditions.push({
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                {
                    owner: {
                        name: { contains: search, mode: "insensitive" },
                    },
                },
            ],
        });
    }

    const where: Prisma.EventWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: { createdAt: "desc" },
            include: {
                owner: {
                    select: { id: true, name: true, avatar: true },
                },
                _count: {
                    select: { registrations: true, reviews: true },
                },
            },
        }),
        prisma.event.count({ where }),
    ]);

    return {
        data: events,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

// get all events for admin dashboard..
const adminGetAllEvents = async (filters: IAdminEventFilters) => {
    const {
        search,
        status,
        upcoming,
        page = '1',
        limit = '20',
    } = filters;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.EventWhereInput[] = [];

    // Upcoming + Pending (Dashboard Main Page)
    if (upcoming === 'true') {
        andConditions.push({
            startAt: {
                gte: new Date(),
            },
        });
    }

    // Dropdown Filters
    if (status === 'UPCOMING') {
        andConditions.push({
            startAt: {
                gte: new Date(),
            },
        });
    } else if (status === 'PAST') {
        andConditions.push({
            startAt: {
                lt: new Date(),
            },
        });
    } else if (status) {
        andConditions.push({
            status: status as EventStatus,
        });
    }

    // Search
    if (search) {
        andConditions.push({
            OR: [
                {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    owner: {
                        name: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
        });
    }

    const where: Prisma.EventWhereInput =
        andConditions.length > 0
            ? {
                AND: andConditions,
            }
            : {};

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                featuredEvent: true,
                _count: {
                    select: {
                        registrations: true,
                        reviews: true,
                    },
                },
            },
        }),

        prisma.event.count({
            where,
        }),
    ]);

    return {
        data: events,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

// Get single event details (public: only APPROVED events)..
const getEventById = async (id: string) => {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            owner: {
                select: { id: true, name: true, avatar: true, email: true },
            },
            reviews: {
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    registrations: {
                        where: {
                            status: 'APPROVED',
                            paymentStatus: {
                                in: ['PAID', 'FREE']
                            }
                        }
                    }
                },
            },
        },
    });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    return event;
};

// Create a new event (status defaults to PENDING, requires admin approval).
const createEvent = async (ownerId: string, payload: ICreateEvent) => {
    const event = await prisma.event.create({
        data: {
            ...payload,
            startAt: new Date(payload.startAt),
            registrationFee: payload.registrationFee ?? 0,
            visibility: payload.visibility ?? EventVisibility.PUBLIC,
            status: EventStatus.PENDING,
            ownerId,
        },
        include: {
            owner: { select: { id: true, name: true, avatar: true } },
        },
    });

    return event;
};

// Update an event — only the owner can update edit event details..
const updateEvent = async (
    eventId: string,
    requesterId: string,
    payload: IUpdateEvent
) => {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.ownerId !== requesterId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to update this event"
        );
    }

    const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
            ...payload,
            ...(payload.startAt && { startAt: new Date(payload.startAt) }),
        },
        include: {
            owner: { select: { id: true, name: true, avatar: true } },
        },
    });

    return updated;
};

// Delete an event — only the owner can delete..
const deleteEvent = async (eventId: string, requesterId: string) => {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.ownerId !== requesterId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to delete this event"
        );
    }

    await prisma.event.delete({ where: { id: eventId } });

    return { message: "Event deleted successfully" };
};

// Get events created by the currently logged-in user..
const getMyEvents = async (
    userId: string,
    filters: IMyEventFilters
) => {
    const {
        search,
        visibility,
        status,
        page = "1",
        limit = "10",
    } = filters;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.EventWhereInput[] = [
        {
            ownerId: userId,
        },
    ];

    // title search only
    if (search) {
        andConditions.push({
            title: {
                contains: search,
                mode: "insensitive",
            },
        });
    }

    // PUBLIC / PRIVATE
    if (visibility) {
        andConditions.push({
            visibility,
        });
    }

    if (status === 'UPCOMING') {
        andConditions.push({
            startAt: {
                gte: new Date(),
            },
        });
    }
    else if (status === 'PAST') {
        andConditions.push({
            startAt: {
                lt: new Date(),
            },
        });
    }
    else if (status) {
        andConditions.push({
            status: status as EventStatus,
        });
    }

    const where: Prisma.EventWhereInput = {
        AND: andConditions,
    };

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                _count: {
                    select: {
                        reviews: true,
                    },
                },
                registrations: {
                    select: {
                        status: true,
                        paymentStatus: true,
                    },
                },
            },
        }),

        prisma.event.count({
            where,
        }),
    ]);

    const data = events.map((event) => {
        let participantCount = 0;

        // PUBLIC + FREE
        if (
            event.visibility === EventVisibility.PUBLIC &&
            Number(event.registrationFee) === 0
        ) {
            participantCount = event.registrations.length;
        }

        // PUBLIC + PAID
        else if (
            event.visibility === EventVisibility.PUBLIC &&
            Number(event.registrationFee) > 0
        ) {
            participantCount = event.registrations.filter(
                (registration) =>
                    registration.status === JoinStatus.APPROVED &&
                    registration.paymentStatus ===
                    RegistrationPaymentStatus.PAID
            ).length;
        }

        // PRIVATE + FREE
        else if (
            event.visibility === EventVisibility.PRIVATE &&
            Number(event.registrationFee) === 0
        ) {
            participantCount = event.registrations.filter(
                (registration) =>
                    registration.status === JoinStatus.APPROVED
            ).length;
        }

        // PRIVATE + PAID
        else {
            participantCount = event.registrations.filter(
                (registration) =>
                    registration.status === JoinStatus.APPROVED &&
                    registration.paymentStatus ===
                    RegistrationPaymentStatus.PAID
            ).length;
        }

        return {
            ...event,
            participantCount,
            registrations: undefined,
        };
    });

    return {
        data,
        meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
};

// Approve or Reject an event — Admin only..
const updateEventStatus = async (
    eventId: string,
    payload: IUpdateEventStatus
) => {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    const updated = await prisma.event.update({
        where: { id: eventId },
        data: { status: payload.status },
        include: {
            owner: { select: { id: true, name: true, email: true } },
        },
    });

    return updated;
};

// Force delete any event — Admin only..
const adminDeleteEvent = async (eventId: string) => {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    await prisma.event.delete({ where: { id: eventId } });

    return { message: "Event force deleted by admin" };
};

export const eventService = {
    getAllEvents,
    adminGetAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getMyEvents,
    updateEventStatus,
    adminDeleteEvent,
};