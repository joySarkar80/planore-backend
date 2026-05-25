import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { UserSearchableFields } from './user.constant';
import bcryptJs from 'bcryptjs';
import { Prisma, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import { USER_ROLE } from '../../middlewares/auth';

export type TUserPayload = {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "USER";
    avatar?: string;
    rating?: number;
};

const adminGetAllUsers = async (
    currentAdminId: string,
    query: Record<string, unknown>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm as string | undefined;

    // Admin cannot see themselves in the list
    const whereConditions: Prisma.UserWhereInput[] = [
        { id: { not: currentAdminId } },
    ];

    if (searchTerm) {
        whereConditions.push({
            OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
        });
    }

    const where: Prisma.UserWhereInput = { AND: whereConditions };

    const [result, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatar: true,
                createdAt: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
        data: result,
    };
};

const findUserById = async (userId: string, currentUser: any) => {
    if (
        currentUser.role !== USER_ROLE.admin &&
        currentUser.id !== userId
    ) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            'You are not allowed to access this user'
        );
    }
    const result = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
    }
    return result;
};


// update users profile
const updateUserById = async (userId: string, payload: Partial<TUserPayload>) => {
    const result = await prisma.user.update({
        where: { id: userId },
        data: {
            name: payload.name,
            avatar: payload.avatar,
        },
        select: {
            id: true,
            name: true,
            avatar: true,
        },
    });
    return result;
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

    return prisma.user.update({
        where: { id: userId },
        data: { status },
        select: { id: true, name: true, email: true, role: true, status: true },
    });
};

const deleteUserById = async (userId: string) => {
    const result = await prisma.user.delete({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            avatar: true,
        },
    });
    return result;
};

const getMyProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true,
            registrations: {
                where: {
                    status: 'APPROVED',
                    event: {
                        startAt: { gte: new Date() },
                        status: 'APPROVED',
                    },
                },
                take: 5,
                orderBy: { event: { startAt: 'asc' } },
                select: {
                    id: true,
                    paymentStatus: true,
                    event: {
                        select: {
                            id: true,
                            title: true,
                            startAt: true,
                            visibility: true,
                            registrationFee: true,
                            venue: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    return user;
};

export const UserService = {
    adminGetAllUsers,
    findUserById,
    updateUserById,
    updateUserStatus,
    deleteUserById,
    getMyProfile,
};