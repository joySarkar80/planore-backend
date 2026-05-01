import { USER_ROLE } from './../modules/User/user.utils';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { prisma } from '../lib/prisma';

const auth = (...requiredRoles: (keyof typeof USER_ROLE)[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization;

        // checking if the token is missing
        if (!token) {
            throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
        }

        // checking if the given token is valid
        const decoded = jwt.verify(
            token,
            config.jwt_access_secret as string,
        ) as JwtPayload;

        const { role, email } = decoded;

        // checking if the user is exist
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
        }

        if (requiredRoles && !requiredRoles.includes(role)) {
            throw new AppError(
                httpStatus.UNAUTHORIZED,
                'You are not authorized!',
            );
        }

        req.user = decoded as JwtPayload & { role: string };
        next();
    });
};

export default auth;