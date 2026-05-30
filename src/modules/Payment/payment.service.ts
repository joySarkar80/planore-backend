import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { hostBanService } from '../HostBan/hostBan.service';
import { registrationService } from '../Registration/registration.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-12-18.acacia' as any,
    maxNetworkRetries: 3,
    timeout: 60000,
});

// payment.service.ts
const createCheckoutSession = async (
    payload: {
        eventId: string;
        eventTitle: string;
        registrationId?: string;
        userId: string;
        amount: number;
        userEmail: string;
        successUrl?: string;
        cancelUrl?: string;
    },
    clientTx?: any
) => {
    const db = clientTx || prisma;

    const event = await db.event.findUnique({
        where: { id: payload.eventId }
    });
    if (!event) {
        throw new AppError(httpStatus.NOT_FOUND, "Event not found.");
    }

    const user = await registrationService.findActiveUser(payload.userId);
    if (user.status === "BANNED") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Your account is banned by admin. You cannot make payment."
        );
    }

    const isBannedByHost = await hostBanService.checkIfBanned(event.ownerId, payload.userId);
    if (isBannedByHost) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You cannot pay for this event. Your account is blocked by the Organizer."
        );
    }

    const amountInCents = Math.round(payload.amount * 100);

    if (payload.amount > 0 && payload.amount < 0.50) {
        throw new AppError(httpStatus.BAD_REQUEST, "Minimum payment amount must be at least $0.50 USD.");
    }

    const successUrl = payload.successUrl ?? `${process.env.FRONTEND_URL}/dashboard/joined-events?payment=success`;
    const cancelUrl = payload.cancelUrl ?? `${process.env.FRONTEND_URL}/dashboard/invitations?status=cancel`;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: payload.userEmail,

        client_reference_id: payload.registrationId || undefined,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: { name: payload.eventTitle },
                    unit_amount: amountInCents,
                },
                quantity: 1,
            },
        ],
        metadata: {
            eventId: payload.eventId,
            userId: payload.userId,
            ...(payload.registrationId && { registrationId: payload.registrationId }),
        },
    });

    await db.payment.create({
        data: {
            userId: payload.userId,
            eventId: payload.eventId,
            registrationId: payload.registrationId || null,
            amount: payload.amount,
            provider: 'STRIPE',
            transactionId: session.id,
            status: 'INITIATED',
        },
    });

    return session;
};


const handleWebhook = async (rawBody: Buffer, signature: string) => {
    let event: any;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        throw new AppError(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const stripeSessionId = session.id;

        const eventId = session.metadata.eventId;
        const userId = session.metadata.userId;
        const metadataRegistrationId = session.metadata.registrationId;

        if (stripeSessionId) {
            const paymentRecord = await prisma.payment.findUnique({
                where: { transactionId: stripeSessionId }
            });

            if (paymentRecord) {
                let actualRegistrationId = metadataRegistrationId || paymentRecord.registrationId;

                await prisma.$transaction(async (tx) => {
                    if (!actualRegistrationId) {
                        let existingReg = await tx.registration.findUnique({
                            where: { eventId_userId: { eventId, userId } }
                        });

                        if (!existingReg) {
                            existingReg = await tx.registration.create({
                                data: {
                                    eventId,
                                    userId,
                                    status: 'PENDING',
                                    paymentStatus: 'PAID',
                                }
                            });
                        }
                        actualRegistrationId = existingReg.id;
                    }
                    else {
                        const registration = await tx.registration.findUnique({
                            where: { id: actualRegistrationId },
                        });

                        if (registration) {
                            const updateData: any = { paymentStatus: 'PAID' };
                            if (registration.status !== 'APPROVED') {
                                updateData.status = 'PENDING';
                            }
                            await tx.registration.update({
                                where: { id: actualRegistrationId },
                                data: updateData,
                            });
                        }
                    }

                    await tx.payment.update({
                        where: { id: paymentRecord.id },
                        data: {
                            status: 'SUCCESS',
                            registrationId: actualRegistrationId
                        },
                    });
                });
            }
        }
    }

    return { received: true };
};

export const paymentService = {
    createCheckoutSession,
    handleWebhook,
};