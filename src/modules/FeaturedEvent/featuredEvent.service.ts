import { EventStatus } from '@prisma/client';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';

const setFeaturedEvent = async (eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

  if (event.status !== EventStatus.APPROVED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only APPROVED events can be featured'
    );
  }

  // Only one featured event allowed at a time
  await prisma.featuredEvent.deleteMany({});

  const featured = await prisma.featuredEvent.create({
    data: { eventId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startAt: true,
          status: true,
          owner: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  return featured;
};

const getFeaturedEvent = async () => {
  return prisma.featuredEvent.findFirst({
    include: {
      event: {
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          _count: { select: { registrations: true } },
        },
      },
    },
  });
};

export const featuredEventService = {
  setFeaturedEvent,
  getFeaturedEvent,
};