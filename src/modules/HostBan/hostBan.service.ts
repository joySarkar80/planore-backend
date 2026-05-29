import { prisma } from "../../lib/prisma";
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

const banUser = async (hostId: string, payload: { userId: string; reason?: string }) => {
    const { userId, reason } = payload;

    if (hostId === userId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You cannot ban yourself');
    }

    // Check existing ban
    const existingBan = await prisma.hostBan.findUnique({
        where: { hostId_userId: { hostId, userId } },
    });
    if (existingBan) {
        throw new AppError(httpStatus.CONFLICT, 'User is already banned');
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
        // 1. Create HostBan record
        await tx.hostBan.create({
            data: { hostId, userId, reason },
        });

        // 2. Get all events owned by this host
        const hostEvents = await tx.event.findMany({
            where: { ownerId: hostId },
            select: { id: true },
        });
        const eventIds = hostEvents.map((e) => e.id);

        if (eventIds.length === 0) return;

        // 3. Update pending/invited registrations → REJECTED
        await tx.registration.updateMany({
            where: {
                userId,
                eventId: { in: eventIds },
                status: { in: ['PENDING', 'INVITED'] },
            },
            data: { status: 'REJECTED' },
        });

        // 4. Update approved registrations → BANNED
        await tx.registration.updateMany({
            where: {
                userId,
                eventId: { in: eventIds },
                status: 'APPROVED',
            },
            data: { status: 'BANNED' },
        });
    });

    return { message: 'User has been banned successfully' };
};

const unbanUser = async (hostId: string, userId: string) => {
    const ban = await prisma.hostBan.findUnique({
        where: { hostId_userId: { hostId, userId } },
    });
    if (!ban) {
        throw new AppError(httpStatus.NOT_FOUND, 'Ban record not found');
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
        // 1. Delete HostBan record
        await tx.hostBan.delete({
            where: { hostId_userId: { hostId, userId } },
        });

        // 2. Get upcoming events owned by this host
        const upcomingEvents = await tx.event.findMany({
            where: {
                ownerId: hostId,
                startAt: { gte: now },
            },
            select: { id: true },
        });
        const eventIds = upcomingEvents.map((e) => e.id);

        if (eventIds.length === 0) return;

        // 3. Update BANNED/REJECTED registrations → PENDING (only upcoming events)
        await tx.registration.updateMany({
            where: {
                userId,
                eventId: { in: eventIds },
                status: { in: ['BANNED', 'REJECTED'] },
            },
            data: { status: 'PENDING' },
        });
    });

    return { message: 'User has been unbanned successfully' };
};

const getBannedUsers = async (hostId: string) => {
    const bans = await prisma.hostBan.findMany({
        where: { hostId },
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
        orderBy: { createdAt: 'desc' },
    });
    return bans;
};

const checkIfBanned = async (hostId: string, userId: string) => {
    const ban = await prisma.hostBan.findUnique({
        where: { hostId_userId: { hostId, userId } },
    });
    return !!ban;
};

export const hostBanService = {
    banUser,
    unbanUser,
    getBannedUsers,
    checkIfBanned,
};