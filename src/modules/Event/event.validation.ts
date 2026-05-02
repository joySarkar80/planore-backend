import { z } from 'zod';

export const createEventSchema = z.object({
    body: z.object({
        title: z.string().min(3, { message: "টাইটেল অন্তত ৩ অক্ষরের হতে হবে" }),
        description: z.string().min(10, { message: "বিবরণ অন্তত ১০ অক্ষরের হতে হবে" }),
        startAt: z.string(),
        venue: z.string().optional(),
        eventLink: z.string().optional(),
        visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
        registrationFee: z.number().nonnegative().optional(),
    }),
});