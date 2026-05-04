import { z } from "zod";

// POST /registrations/invite
const inviteUserSchema = z.object({
  body: z.object({
    eventId: z
      .string({ required_error: "Event ID is required" })
      .uuid("Invalid event ID format"), 
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address"), 
  }),
});

// POST /registrations/pay-join/:eventId
// Body carries the transactionId returned by the payment gateway
const payJoinSchema = z.object({
  body: z.object({
    transactionId: z
      .string({ required_error: "Transaction ID is required" })
      .min(1, "Transaction ID cannot be empty"),
  }),
});

// PATCH /registrations/accept/:id  (paid invite — needs transactionId)
const acceptInviteSchema = z.object({
  body: z
    .object({
      transactionId: z.string().min(1).optional(),
    })
    .optional(),
});

export const registrationValidation = {
  inviteUserSchema,
  payJoinSchema,
  acceptInviteSchema,
};