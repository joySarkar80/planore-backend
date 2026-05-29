import { z } from 'zod';

export const banUserSchema = z.object({
    body: z.object({
        userId: z.string().uuid(),
        reason: z.string().optional(),
    }),
});