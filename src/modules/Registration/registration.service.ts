import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";

import { EventVisibility, JoinStatus, PaymentStatus, RegistrationPaymentStatus } from "@prisma/client";
import { paymentService } from "../Payment/payment.service";
import { hostBanService } from "../HostBan/hostBan.service";




// Fetch event and throw 404 if missing or not approved
const findApprovedEvent = async (eventId: string) => {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found");
    }

    if (event.status !== "APPROVED") {
        throw new AppError(httpStatus.BAD_REQUEST, "Event is not approved by admin!");
    }

    return event;
};

// fetch active user..
const findActiveUser = async (identifier: string) => {
    const isEmail = identifier.includes("@");

    const user = await prisma.user.findUnique({
        where: isEmail ? { email: identifier } : { id: identifier },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.status === "BANNED") {
        throw new AppError(httpStatus.BAD_REQUEST, "User is BANNED by admin!23");
    }

    return user;
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

    const user = await findActiveUser(userId);

    const existingRegistration = await prisma.registration.findUnique({
        where: {
            eventId_userId: { eventId, userId }
        },
        include: { user: { select: { email: true, name: true } } }
    });

    const isFree = Number(event.registrationFee) === 0;
    const isPublic = event.visibility === EventVisibility.PUBLIC;

    if (existingRegistration) {
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
        // 2. Private Free
        else if (!isPublic && isFree) {
            if (status === JoinStatus.PENDING) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered please wait for owner approval.");
            }
            else if (status === JoinStatus.APPROVED) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered!!");
            }
        }
        // 3. Private Paid
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
        // 4. Public Free
        else if (isPublic && isFree) {
            if (status === JoinStatus.APPROVED) {
                throw new AppError(httpStatus.BAD_REQUEST, "You have already registered!!");
            }
        }
        throw new AppError(httpStatus.BAD_REQUEST, "You have already registered for this event.");
    }

    // Check if user is banned by this host
    const isBanned = await hostBanService.checkIfBanned(event.ownerId, userId);
    if (isBanned) {
        throw new AppError(httpStatus.FORBIDDEN, 'You are not allowed to join events by this Organizer.');
    }

    if (event.ownerId === userId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Event owners cannot join their own event");
    }

    if (isPublic && !isFree) {
        const stripeSession = await paymentService.createCheckoutSession({
            eventId: event.id,
            eventTitle: event.title,
            userId, // registrationId বাদ দেওয়া হয়েছে, পেমেন্ট হলে ওয়েবহুক ক্রিয়েট করবে
            amount: Number(event.registrationFee),
            userEmail: user.email,
            successUrl: `${process.env.FRONTEND_URL}/dashboard/joined-events?payment=success`,
            cancelUrl: `${process.env.FRONTEND_URL}/events/${event.id}?status=cancel`,
        });

        // registration null রিটার্ন করছি কারণ এখনো ক্রিয়েট হয়নি
        return { registration: null, checkoutUrl: stripeSession.url };
    }


    let initialStatus: JoinStatus = JoinStatus.PENDING;
    let initialPaymentStatus: RegistrationPaymentStatus = RegistrationPaymentStatus.UNPAID;

    if (isPublic && isFree) {
        initialStatus = JoinStatus.APPROVED;
        initialPaymentStatus = RegistrationPaymentStatus.FREE;
    } else if (!isPublic && isFree) {
        initialStatus = JoinStatus.PENDING;
        initialPaymentStatus = RegistrationPaymentStatus.FREE;
    } else if (!isPublic && !isFree) {
        initialStatus = JoinStatus.PENDING;
        initialPaymentStatus = RegistrationPaymentStatus.UNPAID;
    }

    const registration = await prisma.registration.create({
        data: {
            eventId,
            userId,
            status: initialStatus,
            paymentStatus: initialPaymentStatus,
        },
        include: { user: { select: { email: true, name: true } } }
    });

    return { registration, checkoutUrl: null };
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

    // 2. ownership check
    if (event.ownerId !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, "Only owner can invite");
    }

    // 3. find user by email
    const user = await findActiveUser(email);

    if (user.id === ownerId) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot invite yourself");
    }

    // Check if user is banned by this host
    const isBanned = await hostBanService.checkIfBanned(ownerId, user.id);
    if (isBanned) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is banned from your events');
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

    return {
        event,
        participants
    };
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

    if (status === "APPROVED") {
        await findActiveUser(registration.userId);
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


const getJoinedEventsForUser = async (
    userId: string,
    filter: 'ALL EVENTS' | 'UPCOMING' | 'PAST' = 'ALL EVENTS'
) => {
    const now = new Date();

    const joinedRegistrations = await prisma.registration.findMany({
        where: {
            userId,
            NOT: {
                paymentStatus: RegistrationPaymentStatus.UNPAID,
                event: {
                    visibility: EventVisibility.PUBLIC,
                },
            },
            // Apply event date filtering only for UPCOMING and PAST
            ...(filter !== 'ALL EVENTS' && {
                event: {
                    startAt: filter === 'UPCOMING' ? { gte: now } : { lt: now },
                },
            }),
        },
        include: {
            event: {
                include: {
                    reviews: {
                        where: { userId },
                        take: 1,
                    },
                },
            },
        },
        // Apply conditional sorting dynamically
        orderBy:
            filter === 'ALL EVENTS'
                ? { createdAt: 'desc' } // New logic for ALL EVENTS
                : {
                    event: {
                        startAt: filter === 'UPCOMING' ? 'asc' : 'desc',
                    },
                },
    });

    return joinedRegistrations;
};

const deleteRegistration = async (ownerId: string, registrationId: string) => {
    const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { event: true },
    });

    if (!registration) {
        throw new AppError(httpStatus.NOT_FOUND, 'Registration not found');
    }

    if (registration.event.ownerId !== ownerId) {
        throw new AppError(httpStatus.FORBIDDEN, 'Only event owner can delete registrations');
    }

    await prisma.registration.delete({ where: { id: registrationId } });
    return { message: 'Registration deleted successfully' };
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
    deleteRegistration
};