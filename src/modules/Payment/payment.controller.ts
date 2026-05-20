import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    const result = await paymentService.handleWebhook(req.body, sig);

    res.status(httpStatus.OK).json(result);
});

export const paymentController = {
    handleStripeWebhook,
};