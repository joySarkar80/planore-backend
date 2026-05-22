import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

// const createPaymentSession = catchAsync(async (req, res) => {
//     const userId = req.user?.id; // Auth middleware থেকে পাওয়া ইউজার আইডি
//     const userEmail = req.user?.email; // Auth middleware থেকে পাওয়া ইমেইল
//     const userName = req.user?.name;
//     const { eventId, registrationId } = req.body;

//     // ১. ভ্যালিডেশন: রেজিস্ট্রেশন বা ইনভাইটেশন রেকর্ডটি আসলেই আছে কিনা এবং এই ইউজারের কিনা
//     const registration = await prisma.registration.findUnique({
//         where: { id: registrationId },
//         include: { event: true }
//     });

//     if (!registration || registration.userId !== userId) {
//         throw new AppError(httpStatus.NOT_FOUND, "Invitation or registration records not found.");
//     }

//     if (Number(registration.event.registrationFee) <= 0) {
//         throw new AppError(httpStatus.BAD_REQUEST, "This event is free. No payment needed.");
//     }

//     // ২. পেমেন্ট সেশন ক্রিয়েট করার জন্য পেলোড তৈরি
//     const payload = {
//         eventId: registration.eventId,
//         eventTitle: registration.event.title,
//         registrationId: registration.id,
//         userId: userId,
//         amount: Number(registration.event.registrationFee),
//         userEmail: userEmail || "customer@example.com",
//     };

//     const session = await paymentService.createCheckoutSession(payload);

//     // ৩. রেসপন্সে Stripe-এর পেমেন্ট URL ফ্রন্টএন্ডে পাঠিয়ে দেওয়া
//     res.status(httpStatus.OK).json({
//         success: true,
//         statusCode: httpStatus.OK,
//         message: "Stripe checkout session created successfully",
//         data: {
//             paymentUrl: session.url // এই URL-এই ফ্রন্টএন্ড ইউজারকে রিডাইরেক্ট করবে
//         }
//     });
// });

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

    // পেলোডে URL দুটো পাস করে দিন
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