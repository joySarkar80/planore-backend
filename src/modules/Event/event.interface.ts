import { EventStatus, EventVisibility } from "../../../generated/prisma/enums";


export interface ICreateEvent {
    title: string;
    description: string;
    startAt: Date;
    venue?: string;
    eventLink?: string;
    visibility?: EventVisibility;
    registrationFee?: number;
}

export interface IUpdateEvent {
    title?: string;
    description?: string;
    startAt?: Date;
    venue?: string;
    eventLink?: string;
    visibility?: EventVisibility;
    registrationFee?: number;
}

export interface IUpdateEventStatus {
    status: EventStatus;
}

export interface IEventFilters {
    search?: string;
    visibility?: EventVisibility;
    isFree?: string; // "true" | "false"
    page?: string;
    limit?: string;
}