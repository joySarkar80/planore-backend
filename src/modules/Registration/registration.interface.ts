type TCreateCheckoutSessionPayload = {
    eventId: string;
    eventTitle: string;

    // FIX
    registrationId?: string;

    userId: string;
    amount: number;
    userEmail: string;

    successUrl?: string;
    cancelUrl?: string;
}