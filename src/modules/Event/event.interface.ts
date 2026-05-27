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
    upcoming?: string;
}

export type AdminEventStatusFilter =
    | EventStatus
    | 'UPCOMING'
    | 'PAST';

export interface IAdminEventFilters {
    search?: string;
    status?: AdminEventStatusFilter;
    upcoming?: string;
    page?: string;
    limit?: string;
}

export interface IMyEventFilters {
    search?: string;
    visibility?: EventVisibility;
    status?: 'UPCOMING' | 'PAST';
    page?: string;
    limit?: string;
}

export interface GetMyEventsParams {
    search?: string;
    status?: string;
    visibility?: string;
    page?: number;
    limit?: number;
}