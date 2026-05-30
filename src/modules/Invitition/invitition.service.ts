import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { EventVisibility, JoinStatus, RegistrationPaymentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { hostBanService } from '../HostBan/hostBan.service';
import { registrationService } from '../Registration/registration.service';

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

    const user = await registrationService.findActiveUser(userId);
    if (user.status === "BANNED") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Your account is banned by admin. You cannot respond to this invitation."
        );
    }

    const isBannedByHost = await hostBanService.checkIfBanned(registration.event.ownerId, userId);
    if (isBannedByHost) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You cannot respond to this invitation. Your account is blocked by the Organizer."
        );
    }

    if (registration.status !== JoinStatus.INVITED) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You have already responded to this invitation');
    }

    let newStatus: JoinStatus = registration.status;

    if (action === 'REJECT') {
        newStatus = JoinStatus.REJECTED; 
    } else if (action === 'ACCEPT') {
        const isFree = Number(registration.event.registrationFee) === 0;

        // Public Event Logic
        if (registration.event.visibility === EventVisibility.PUBLIC) {
            if (!isFree) {
                throw new AppError(httpStatus.BAD_REQUEST, 'Public paid events require Stripe payment.');
            }
            newStatus = JoinStatus.APPROVED; // Public Free -> APPROVED
        }
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