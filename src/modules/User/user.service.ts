import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { UserSearchableFields } from './user.constant';
import bcryptJs from 'bcryptjs';
import { Prisma } from '../../../generated/prisma/client';
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

const getAllUsers = async (query: Record<string, unknown>) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = query.searchTerm as string | undefined;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as 'asc' | 'desc') || 'desc';

    // Build where clause
    const whereConditions: Prisma.UserWhereInput[] = [];

    // Search functionality
    if (searchTerm) {
        whereConditions.push({
            OR: UserSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive' as Prisma.QueryMode,
                },
            })),
        });
    }

    // Filter by other fields (excluding pagination & search params)
    const excludeFields = ['searchTerm', 'page', 'limit', 'sortBy', 'sortOrder', 'fields'];
    const filterData = Object.fromEntries(
        Object.entries(query).filter(([key]) => !excludeFields.includes(key)),
    );

    if (Object.keys(filterData).length > 0) {
        whereConditions.push(filterData as Prisma.UserWhereInput);
    }

    const whereClause: Prisma.UserWhereInput =
        whereConditions.length > 0 ? { AND: whereConditions } : {};

    // Execute query
    const [result, total] = await Promise.all([
        prisma.user.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma.user.count({ where: whereClause }),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
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

export const UserService = {
    findUserById,
    getAllUsers,
    updateUserById,
    deleteUserById,
};