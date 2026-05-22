import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

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
        registrationId: string;
        userId: string;
        amount: number;
        userEmail: string;
        successUrl?: string;  
        cancelUrl?: string;   
    },
    clientTx?: any
) => {
    const db = clientTx || prisma;
    const amountInCents = Math.round(payload.amount * 100);

    if (payload.amount > 0 && payload.amount < 0.50) {
        throw new AppError(httpStatus.BAD_REQUEST, "Minimum payment amount must be at least $0.50 USD.");
    }

    // Default URLs, override করা যাবে
    const successUrl = payload.successUrl ?? `${process.env.FRONTEND_URL}/dashboard/joined-events?payment=success`;
    const cancelUrl = payload.cancelUrl ?? `${process.env.FRONTEND_URL}/dashboard/invitations?status=cancel`;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: payload.userEmail,
        client_reference_id: payload.registrationId,
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
            registrationId: payload.registrationId,
        },
    });

    await db.payment.create({
        data: {
            userId: payload.userId,
            eventId: payload.eventId,
            registrationId: payload.registrationId,
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
        const registrationId = session.client_reference_id;

        if (registrationId && stripeSessionId) {
            const paymentRecord = await prisma.payment.findFirst({
                where: {
                    registrationId: registrationId,
                    transactionId: stripeSessionId
                }
            });

            if (paymentRecord) {
                const registration = await prisma.registration.findUnique({
                    where: { id: registrationId },
                });

                if (registration) {
                    const shouldUpdateStatus = registration.status !== 'APPROVED';

                    const updateData: any = {
                        paymentStatus: 'PAID',
                    };

                    if (shouldUpdateStatus) {
                        updateData.status = 'PENDING';
                    }

                    await prisma.$transaction([
                        prisma.payment.update({
                            where: { id: paymentRecord.id },
                            data: { status: 'SUCCESS' },
                        }),
                        prisma.registration.update({
                            where: { id: registrationId },
                            data: updateData, 
                        }),
                    ]);
                }
            }
        }
    }

    return { received: true };
};

export const paymentService = {
    createCheckoutSession,
    handleWebhook,
};