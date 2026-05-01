import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';

export const createToken = (
    jwtPayload: { email: string; role: string; id: string }, 
    secret: Secret,
    expiresIn: string,
) => {
    
    if (!secret) {
        throw new Error("JWT Secret is missing in config!");
    }

    return jwt.sign(jwtPayload, secret, {
        expiresIn: expiresIn as SignOptions['expiresIn'],
    });
};


export const verifyToken = (token: string, secret: Secret) => {
    return jwt.verify(token, secret) as JwtPayload;
};

