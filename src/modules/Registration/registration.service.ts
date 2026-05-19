import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";

import { EventVisibility, JoinStatus, RegistrationPaymentStatus } from "@prisma/client";
import { paymentService } from "../Payment/payment.service";

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


const joinEvent = async (eventId: string, userId: string) => {
    const event = await findApprovedEvent(eventId);

    const existingRegistration = await prisma.registration.findUnique({
        where: {
            eventId_userId: { eventId, userId }
        },
        include: { user: { select: { email: true, name: true } } }
    });

    if (existingRegistration) {
        if (
            existingRegistration.paymentStatus === RegistrationPaymentStatus.PAID ||
            existingRegistration.paymentStatus === RegistrationPaymentStatus.FREE
        ) {
            throw new AppError(httpStatus.BAD_REQUEST, "You have already registered for this event.");
        }

        const isFree = Number(event.registrationFee) === 0;
        const isPublic = event.visibility === EventVisibility.PUBLIC;

        if (isPublic && !isFree) {
            const stripeSession = await paymentService.createCheckoutSession({
                eventId: event.id,
                eventTitle: event.title,
                registrationId: existingRegistration.id,
                userId,
                amount: Number(event.registrationFee),
                userEmail: existingRegistration.user.email,
            });

            return { registration: existingRegistration, checkoutUrl: stripeSession.url };
        }

        throw new AppError(httpStatus.BAD_REQUEST, "You have a pending registration request for this event.");
    }

    if (event.ownerId === userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Event owners cannot join their own event");
    }

    const isFree = Number(event.registrationFee) === 0;
    const isPublic = event.visibility === EventVisibility.PUBLIC;

    let initialStatus: JoinStatus = JoinStatus.PENDING;
    let initialPaymentStatus: RegistrationPaymentStatus = RegistrationPaymentStatus.UNPAID;
    let checkoutUrl: string | null = null;

    if (isPublic && isFree) {
        initialStatus = JoinStatus.APPROVED;
        initialPaymentStatus = RegistrationPaymentStatus.FREE;
    } else if (isPublic && !isFree) {
        initialStatus = JoinStatus.PENDING;
        initialPaymentStatus = RegistrationPaymentStatus.UNPAID;
    } else if (!isPublic && isFree) {
        initialStatus = JoinStatus.PENDING;
        initialPaymentStatus = RegistrationPaymentStatus.FREE;
    } else if (!isPublic && !isFree) {
        initialStatus = JoinStatus.PENDING;
        initialPaymentStatus = RegistrationPaymentStatus.UNPAID;
    }

    return await prisma.$transaction(async (tx) => {
        const registration = await tx.registration.create({
            data: {
                eventId,
                userId,
                status: initialStatus,
                paymentStatus: initialPaymentStatus,
            },
            include: { user: { select: { email: true, name: true } } }
        });

        if (isPublic && !isFree) {
            const stripeSession = await paymentService.createCheckoutSession({
                eventId: event.id,
                eventTitle: event.title,
                registrationId: registration.id,
                userId,
                amount: Number(event.registrationFee),
                userEmail: registration.user.email,
            }, tx);

            checkoutUrl = stripeSession.url;
        }

        return { registration, checkoutUrl };
    });
};

const payForApprovedPrivateEvent = async (eventId: string, userId: string) => {
    const registration = await prisma.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: { event: true, user: { select: { email: true } } }
    });

    if (!registration) throw new AppError(httpStatus.NOT_FOUND, "Registration record not found");
    if (registration.status !== JoinStatus.APPROVED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Your request is not approved yet by the host");
    }
    if (registration.paymentStatus === RegistrationPaymentStatus.PAID) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already paid for this event");
    }

    const stripeSession = await paymentService.createCheckoutSession({
        eventId: registration.eventId,
        eventTitle: registration.event.title,
        registrationId: registration.id,
        userId,
        amount: Number(registration.event.registrationFee),
        userEmail: registration.user.email,
    });

    return { checkoutUrl: stripeSession.url };
};

const inviteUser = async (ownerId: string, payload: { eventId: string; email: string }) => {
    const { eventId, email } = payload;

    // 1. event check
    const event = await findApprovedEvent(eventId);

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.status !== "APPROVED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Event is not approved");
    }

    // 2. ownership check
    if (event.ownerId !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, "Only owner can invite");
    }

    // 3. find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.id === ownerId) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot invite yourself");
    }

    try {
        const registration = await prisma.registration.create({
            data: {
                eventId,
                userId: user.id,
                status: JoinStatus.INVITED,
                paymentStatus: RegistrationPaymentStatus.UNPAID,
                invitedById: ownerId,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                event: {
                    select: { id: true, title: true },
                },
            },
        });

        return registration;
    } catch (error: any) {
        if (error.code === "P2002") {
            throw new AppError(
                httpStatus.CONFLICT,
                "User is already invited or registered for this event"
            );
        }

        throw error;
    }
};

export const registrationService = {
    joinEvent,
    inviteUser,
    payForApprovedPrivateEvent
};