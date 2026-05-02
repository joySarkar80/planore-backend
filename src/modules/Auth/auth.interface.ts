import { JwtPayload } from 'jsonwebtoken';

export type TAuthUser = JwtPayload & {
    id: string;
    role: string;
};

export type TLoginUser = {
    name?: string;
    email: string;
    password?: string;
    img?: string;
};