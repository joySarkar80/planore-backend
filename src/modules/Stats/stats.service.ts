import { prisma } from '../../lib/prisma';

const getDashboardStats = async (userId: string) => {
    const now = new Date();

    const [upcomingApprovedEventsCount, upcomingRegistrationsCount] =
        await Promise.all([
            prisma.event.count({
                where: {
                    ownerId: userId,
                    status: 'APPROVED',
                    startAt: {
                        gte: now,
                    },
                },
            }),

            prisma.registration.count({
                where: {
                    status: 'APPROVED',

                    event: {
                        ownerId: userId,
                        status: 'APPROVED',
                        startAt: {
                            gte: now,
                        },
                    },

                    OR: [
                        {
                            paymentStatus: 'FREE',
                            event: {
                                registrationFee: 0,
                            },
                        },
                        {
                            paymentStatus: 'PAID',
                            event: {
                                registrationFee: {
                                    gt: 0,
                                },
                            },
                        },
                    ],
                },
            }),
        ]);

    return {
        upcomingApprovedEventsCount,
        upcomingRegistrationsCount,
    };
};

export const StatsService = {
    getDashboardStats,
};