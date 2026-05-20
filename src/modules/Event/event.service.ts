
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
    ICreateEvent,
    IEventFilters,
    IUpdateEvent,
    IUpdateEventStatus,
} from "./event.interface";
import { EventStatus, EventVisibility, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

const getAllEvents = async (filters: IEventFilters) => {
    const {
        search,
        visibility,
        isFree,
        page = "1",
        limit = "10",
    } = filters;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    // রিকোয়ারমেন্ট অনুযায়ী: অ্যাডমিন দ্বারা এপ্রুভড সব ইভেন্ট দেখাবে
    const andConditions: Prisma.EventWhereInput[] = [
        { status: EventStatus.APPROVED }
    ];

    // Visibility Filter (Public / Private)
    if (visibility) {
        andConditions.push({ visibility: visibility });
    }

    // Free / Paid Filter (আপনার ৫টি ক্যাটাগরি বাটনের লজিক)
    if (isFree === "true") {
        andConditions.push({ registrationFee: { equals: 0 } });
    } else if (isFree === "false") {
        andConditions.push({ registrationFee: { gt: 0 } });
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
            orderBy: { startAt: "asc" },
            include: { // Select এর বদলে Include ব্যবহার করা ক্লিন কোডের জন্য ভালো
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

/**
 * Get single event details (public: only APPROVED events)
 */
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

// ─────────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────────

/**
 * Create a new event (status defaults to PENDING, requires admin approval)
 */
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

/**
 * Update an event — only the owner can update
 */
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

/**
 * Delete an event — only the owner can delete
 */
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

/**
 * Get events created by the currently logged-in user
 */
const getMyEvents = async (
    userId: string,
    filters: Pick<IEventFilters, "page" | "limit" | "search">
) => {
    const { search, page = "1", limit = "10" } = filters;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.EventWhereInput = {
        ownerId: userId,
        ...(search && {
            title: { contains: search, mode: "insensitive" },
        }),
    };

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: { createdAt: "desc" },
            include: {
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

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

/**
 * Approve or Reject an event — Admin only
 */
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

/**
 * Force delete any event — Admin only
 */
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
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getMyEvents,
    updateEventStatus,
    adminDeleteEvent,
};