import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

const createPaymentSession = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const { eventId, registrationId, successUrl, cancelUrl } = req.body; // <-- এখানে url দুটো ধরুন

    const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: { event: true }
    });

    if (!registration || registration.userId !== userId) {
        throw new AppError(httpStatus.NOT_FOUND, "Invitation or registration records not found.");
    }

    if (Number(registration.event.registrationFee) <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "This event is free. No payment needed.");
    }

    
    const payload = {
        eventId: registration.eventId,
        eventTitle: registration.event.title,
        registrationId: registration.id,
        userId: userId,
        amount: Number(registration.event.registrationFee),
        userEmail: userEmail || "customer@example.com",
        successUrl, // <-- Added
        cancelUrl   // <-- Added
    };

    const session = await paymentService.createCheckoutSession(payload);

    res.status(httpStatus.OK).json({
        success: true,
        statusCode: httpStatus.OK,
        message: "Stripe checkout session created successfully",
        data: {
            paymentUrl: session.url
        }
    });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const result = await paymentService.handleWebhook(req.body, sig);
    res.status(httpStatus.OK).json(result);
});

export const paymentController = {
    createPaymentSession,
    handleStripeWebhook,
};