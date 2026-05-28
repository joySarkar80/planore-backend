import { z } from "zod";
import { EventVisibility } from "../../../generated/prisma/enums";

const createEventSchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: "Title is required" })
            .min(3, "Title must be at least 3 characters")
            .max(150, "Title must not exceed 150 characters"),

        description: z
            .string({ required_error: "Description is required" })
            .min(10, "Description must be at least 10 characters"),

        startAt: z
            .string({ required_error: "Start date/time is required" })
            .datetime({ message: "Invalid date format. Use ISO 8601 format" }),

        venue: z.string().max(255).optional(),

        eventLink: z
            .string()
            .url({ message: "Invalid event link URL" })
            .optional(),

        visibility: z
            .enum([EventVisibility.PUBLIC, EventVisibility.PRIVATE])
            .optional()
            .default(EventVisibility.PUBLIC),

        registrationFee: z
            .number()
            .min(0, "Registration fee cannot be negative")
            .optional()
            .default(0)
            .refine(val => val === 0 || val >= 0.50, {
                message: "Paid events must have a minimum fee of 0.50",
            }),
    }),
});

const updateEventSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(3, "Title must be at least 3 characters")
            .max(150, "Title must not exceed 150 characters")
            .optional(),

        description: z
            .string()
            .min(10, "Description must be at least 10 characters")
            .optional(),

        startAt: z
            .string()
            .datetime({ message: "Invalid date format. Use ISO 8601 format" })
            .optional(),

        venue: z.string().max(255).optional(),

        eventLink: z
            .string()
            .url({ message: "Invalid event link URL" })
            .optional(),

        visibility: z
            .enum([EventVisibility.PUBLIC, EventVisibility.PRIVATE])
            .optional(),

        registrationFee: z
            .number()
            .min(0, "Registration fee cannot be negative")
            .optional(),
    }),
});

const updateEventStatusSchema = z.object({
    body: z.object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
            required_error: "Status is required",
            invalid_type_error: "Status must be APPROVED or REJECTED",
        }),
    }),
});

export const eventValidation = {
    createEventSchema,
    updateEventSchema,
    updateEventStatusSchema,
};