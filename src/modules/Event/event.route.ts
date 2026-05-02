import express from 'express';
import { EventController } from './event.controller';

const router = express.Router();

router.get('/', EventController.getAllEventsHandler);
router.get('/:id', EventController.getSingleEventHandler);

export const EventRoutes = router;