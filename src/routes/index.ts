import { Router } from "express";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { UserRoutes } from "../modules/User/user.route";
import { EventRoutes } from "../modules/Event/event.route";

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
    {
        path: '/auth',
        route: AuthRoutes,
    },
    {
        path: '/users',
        route: UserRoutes
    },
    {
        path: '/events',
        route: EventRoutes
    }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

