import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { EventVisibility, JoinStatus, RegistrationPaymentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const getMyInvitations = async (userId: string) => {
    const invitations = await prisma.registration.findMany({
        where: {
            userId,
            status: JoinStatus.INVITED,
        },
        include: {
            event: true,
            invitedBy: {
                select: { name: true, email: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return invitations;
};

const respondToInvitation = async (userId: string, registrationId: string, action: 'ACCEPT' | 'REJECT') => {
    const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { event: true },
    });

    if (!registration || registration.userId !== userId) {
        throw new AppError(httpStatus.NOT_FOUND, 'Invitation not found or unauthorized');
    }

    if (registration.status !== JoinStatus.INVITED) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You have already responded to this invitation');
    }

    let newStatus: JoinStatus = registration.status;

    if (action === 'REJECT') {
        newStatus = JoinStatus.REJECTED; // রিজেক্ট করলে REJECTED আপডেট হবে
    } else if (action === 'ACCEPT') {
        const isFree = Number(registration.event.registrationFee) === 0;

        // Public Event Logic
        if (registration.event.visibility === EventVisibility.PUBLIC) {
            if (!isFree) {
                // Public Paid ইভেন্ট স্ট্রাইপ দিয়ে হ্যান্ডেল হবে, তাই সরাসরি Accept ব্লক করা হলো
                throw new AppError(httpStatus.BAD_REQUEST, 'Public paid events require Stripe payment.');
            }
            newStatus = JoinStatus.APPROVED; // Public Free -> APPROVED
        }
        // Private Event Logic (Free এবং Paid উভয়ের জন্যই PENDING হবে)
        else if (registration.event.visibility === EventVisibility.PRIVATE) {
            newStatus = JoinStatus.PENDING; // Private Free & Private Paid -> PENDING
        }
    }

    const updatedRegistration = await prisma.registration.update({
        where: { id: registrationId },
        data: { status: newStatus },
    });

    return updatedRegistration;
};

export const InvititionService = {
    getMyInvitations,
    respondToInvitation,
};