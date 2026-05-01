import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../errors/AppError';

import bcryptJs from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { USER_ROLE } from '../User/user.utils';
import { createToken, verifyToken } from './auth.utils';
// import { createToken, verifyToken } from './auth.utils';

export type TLoginUser = {
    name?: string;
    email: string;
    password?: string;
    img?: string;
};

const loginUser = async (payload: TLoginUser) => {
    // checking if the user exists
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
    }

    // checking if the password is correct
    if (!payload.password || !user.password) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Password is required!');
    }

    const isPasswordMatched = await bcryptJs.compare(
        payload.password,
        user.password,
    );

    if (!isPasswordMatched) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Password Incorrect!');
    }

    const jwtPayload = {
        email: user.email,
        role: user.role,
        id: user.id,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string,
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_secret as string,
        config.jwt_refresh_expires_in as string,
    );

    return {
        accessToken,
        refreshToken,
    };
};

const refreshToken = async (token: string) => {
    // checking if the given token is valid
    const decoded = verifyToken(token, config.jwt_refresh_secret as string);

    const { email } = decoded;

    // checking if the user exists
    const user = await prisma.user.findUnique({
        where: { email: email },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
    }

    const jwtPayload = {
        email: user.email,
        role: user.role,
        id: user.id,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires_in as string,
    );

    return {
        accessToken,
    };
};

const registerUser = async (userData: TLoginUser) => {
    // hashing password
    const hashedPassword = await bcryptJs.hash(
        userData.password as string,
        Number(config.bcrypt_salt_rounds),
    );

    const user = await prisma.user.create({
        data: {
            name: userData.name || '',
            email: userData.email,
            password: hashedPassword,
            img: userData.img,
            role: USER_ROLE.user,
        },
    });

    return user;
};

export const AuthServices = {
    loginUser,
    refreshToken,
    registerUser,
};