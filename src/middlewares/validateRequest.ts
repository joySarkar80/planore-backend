import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import catchAsync from '../utils/catchAsync';


const validateRequest = (schema: AnyZodObject) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const parsed = await schema.parseAsync({
            body: req.body,
            cookies: req.cookies,
        });

        req.body = parsed.body;
        req.cookies = parsed.cookies;

        next();
    });
};

export default validateRequest;



// import { NextFunction, Request, Response } from 'express';
// import { AnyZodObject } from 'zod'; // Standard import
// import catchAsync from '../utils/catchAsync';

// const validateRequest = (schema: AnyZodObject) => {
//     return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//         // এখানে স্কিমা চেক করবে রিকোয়েস্টের বডি, কুকি বা কোয়েরি
//         const parsed = await schema.parseAsync({
//             body: req.body,
//             cookies: req.cookies,
//             query: req.query,
//             params: req.params
//         });

//         // ভ্যালিডেশনের পর ডাটা আপডেট করে দেওয়া ভালো অভ্যাস
//         req.body = parsed.body;
//         req.cookies = parsed.cookies;

//         next();
//     });
// };

// export default validateRequest;
