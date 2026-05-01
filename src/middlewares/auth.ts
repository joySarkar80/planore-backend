import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import { prisma } from '../lib/prisma';

export enum USER_ROLE {
    admin = 'ADMIN',
    user = 'USER',
}

// extend request type (optional but recommended)
// export interface AuthRequest extends Request {
//     user?: JwtPayload & { email: string; role: USER_ROLE };
// }

const auth = (...roles: USER_ROLE[]) => {
    return catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const token = req.cookies?.accessToken;

            // 1. token check
            if (!token) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    'You are not authorized!'
                );
            }

            let decoded: JwtPayload;

            // 2. verify token safely
            try {
                decoded = jwt.verify(
                    token,
                    config.jwt_access_secret as string
                ) as JwtPayload;
            } catch (err) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    'Invalid or expired token!'
                );
            }

            const { role, email } = decoded;

            // 3. payload validation
            if (!email || !role) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    'Invalid token payload!'
                );
            }

            // 4. check user exists
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                throw new AppError(
                    httpStatus.NOT_FOUND,
                    'This user is not found!'
                );
            }

            // 5. role authorization check
            if (roles.length && !roles.includes(role as USER_ROLE)) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    'You are not authorized!'
                );
            }

            // 6. attach user to request
            req.user = {
                email,
                role,
                ...decoded,
            };

            next();
        }
    );
};

export default auth;