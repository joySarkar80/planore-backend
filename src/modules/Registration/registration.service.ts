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
        throw new AppError(httpStatus.BAD_REQUEST, "Event is not approved by an admin for registration!");
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
        const isFree = Number(event.registrationFee) === 0;
        const isPublic = event.visibility === EventVisibility.PUBLIC;
        const { status, paymentStatus } = existingRegistration;

        if (isPublic && !isFree) {
            if (paymentStatus === RegistrationPaymentStatus.UNPAID && status === JoinStatus.PENDING) {
                const stripeSession = await paymentService.createCheckoutSession({
                    eventId: event.id,
                    eventTitle: event.title,
                    registrationId: existingRegistration.id,
                    userId,
                    amount: Number(event.registrationFee),
                    userEmail: existingRegistration.user.email,
                    successUrl: `${process.env.FRONTEND_URL}/dashboard/joined-events?payment=success`,
                    cancelUrl: `${process.env.FRONTEND_URL}/events/${event.id}?status=cancel`,
                });
                return { registration: existingRegistration, checkoutUrl: stripeSession.url };
            }
            else if (paymentStatus === RegistrationPaymentStatus.PAID && status === JoinStatus.PENDING) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered please wait for owner approval.");
            }
            else if (paymentStatus === RegistrationPaymentStatus.PAID && status === JoinStatus.APPROVED) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered!!");
            }
        }

        // ২. Private Free
        else if (!isPublic && isFree) {
            if (status === JoinStatus.PENDING) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered please wait for owner approval.");
            }
            else if (status === JoinStatus.APPROVED) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered!!");
            }
        }

        // ৩. Private Paid
        else if (!isPublic && !isFree) {
            if (status === JoinStatus.PENDING && paymentStatus === RegistrationPaymentStatus.UNPAID) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered for this event. Please wait for event owner approval. Then make payment from the join event page. Dashboard -> then click join events.");
            }
            else if (status === JoinStatus.APPROVED && paymentStatus === RegistrationPaymentStatus.UNPAID) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered please pay from join events page. Dashboard -> then click join events.");
            }
            else if (paymentStatus === RegistrationPaymentStatus.PAID) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered for this event!!");
            }
        }

        // ৪. Public Free
        else if (isPublic && isFree) {
            if (status === JoinStatus.APPROVED) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered!!");
            }
        }

        throw new AppError(httpStatus.BAD_REQUEST, "You have already registered for this event.");
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
                successUrl: `${process.env.FRONTEND_URL}/dashboard/joined-events?payment=success`,
                cancelUrl: `${process.env.FRONTEND_URL}/events/${event.id}?status=cancel`,
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
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot pay for this event until it is approved by the event owner");
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
        successUrl: `${process.env.FRONTEND_URL}/dashboard/joined-events?payment=success`,
        cancelUrl: `${process.env.FRONTEND_URL}/dashboard/joined-events?payment=cancel`,
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

    // Conditional payment status logic based on fee (0 means free)
    const isFree = Number(event.registrationFee) === 0;
    const paymentStatus = isFree
        ? RegistrationPaymentStatus.FREE
        : RegistrationPaymentStatus.UNPAID;

    try {
        const registration = await prisma.registration.create({
            data: {
                eventId,
                userId: user.id,
                status: JoinStatus.INVITED,
                paymentStatus: paymentStatus, // Applied conditional logic here
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


const searchUsersForInvitation = async (ownerId: string, query: string, eventId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.ownerId !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, "Only the event owner can search users for invitation");
    }

    const users = await prisma.user.findMany({
        where: {
            id: { not: ownerId },
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            registrations: {
                where: {
                    eventId: eventId,
                },
                select: {
                    id: true,
                    status: true,
                },
            },
        },
    });

    const formattedUsers = users.map((user) => {
        const registration = user.registrations[0];

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            registrationStatus: registration?.status || null,
        };
    });

    return formattedUsers;
};

const getInvitedUsersByEvent = async (ownerId: string, eventId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.ownerId !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, "Only the event owner can view the invited guest list");
    }

    const invitations = await prisma.registration.findMany({
        where: {
            eventId: eventId,
            invitedById: ownerId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return invitations;
};

const getEventParticipants = async (ownerId: string, eventId: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.ownerId !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to manage this event's participants");
    }


    const participants = await prisma.registration.findMany({
        where: { eventId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return participants;
};

const updateParticipantStatus = async (
    ownerId: string,
    registrationId: string,
    status: JoinStatus
) => {

    const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { event: true }
    });

    if (!registration) {
        throw new AppError(httpStatus.NOT_FOUND, "Registration record not found");
    }

    if (registration.event.ownerId !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, "Access denied. Only event host can update status");
    }


    const updatedRegistration = await prisma.registration.update({
        where: { id: registrationId },
        data: { status },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });

    return updatedRegistration;
};


export const getJoinedEventsForUser = async (userId: string) => {
    const joinedRegistrations = await prisma.registration.findMany({
        where: {
            userId: userId,
            // status: {
            //     notIn: [JoinStatus.INVITED, JoinStatus.REJECTED]
            // },
            NOT: {
                paymentStatus: RegistrationPaymentStatus.UNPAID,
                event: {
                    visibility: EventVisibility.PUBLIC
                }
            }
        },
        include: {
            event: {
                include: {
                    reviews: {
                        where: {
                            userId: userId
                        },
                        take: 1
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return joinedRegistrations;
};


export const registrationService = {
    joinEvent,
    inviteUser,
    payForApprovedPrivateEvent,
    searchUsersForInvitation,
    getInvitedUsersByEvent,
    getEventParticipants,
    updateParticipantStatus,
    getJoinedEventsForUser,
};