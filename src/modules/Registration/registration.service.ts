import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
// import { RegistrationPaymentStatus } from "@prisma/client";
import { EventVisibility, JoinStatus, RegistrationPaymentStatus } from "@prisma/client";

// Fetch event and throw 404 if missing or not approved
const findApprovedEvent = async (eventId: string) => {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.status !== "APPROVED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Event is not available for registration");
    }

    return event;
};

// Throw 409 if user already has a registration row for this event 
const assertNotAlreadyRegistered = async (eventId: string, userId: string) => {
    const existing = await prisma.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
        throw new AppError(httpStatus.CONFLICT, "You have already registered for this event");
    }
};

// join evetn for public and private for free..
const joinEvent = async (eventId: string, userId: string) => {
    const event = await findApprovedEvent(eventId);
    await assertNotAlreadyRegistered(eventId, userId);

    // Must not be a paid event — use pay-join route for that
    if (Number(event.registrationFee) > 0) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "This is a paid event. Please use the pay & join route"
        );
    }

    // Owner cannot join their own event
    if (event.ownerId === userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Event owners cannot join their own event");
    }

    const isPublic = event.visibility === EventVisibility.PUBLIC;

    const registration = await prisma.registration.create({
        data: {
            eventId,
            userId,
            status: isPublic ? JoinStatus.APPROVED : JoinStatus.PENDING,
            paymentStatus: RegistrationPaymentStatus.UNPAID,
        },
    });

    return registration;
};


export const registrationService = {
    joinEvent,
};