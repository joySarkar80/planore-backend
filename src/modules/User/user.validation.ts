import { z } from 'zod';

export const createUserValidationSchema = z.object({
    body: z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
        Role: z.enum(["ADMIN", "USER"]).optional(),
        avatar: z.string().optional(),
    }),
});

export const updateUserValidationSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().optional(),
        Role: z.enum(["ADMIN", "USER"]).optional(),
        avatar: z.string().optional(),
    }),
});

export const UserValidations = {
    createUserValidationSchema,
    updateUserValidationSchema,
};