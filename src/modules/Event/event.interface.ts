import { Event, EventVisibility } from "../../../generated/prisma/client";

export type IEventFilter = {
    searchTerm?: string;
    visibility?: EventVisibility;
};

export type IEventResponse = Event;