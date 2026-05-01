import { z } from 'zod';

const loginValidationSchema = z.object({
    body: z.object({
        email: z.string({ required_error: 'Email is required.' }).email(),
        password: z.string({ required_error: 'Password is required.' }),
    }),
});

const refreshTokenValidationSchema = z.object({
    cookies: z.object({
        refreshToken: z.string({
            required_error: 'Refresh token is required!',
        }),
    }),
});

export const registerUserValidationSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required.' }),
        email: z.string({ required_error: 'Email is required.' }).email(),
        password: z.string({ required_error: 'Password is required.' }),
        img: z.string().optional(),
    }),
});

export const AuthValidation = {
    loginValidationSchema,
    refreshTokenValidationSchema,
    registerUserValidationSchema,
};