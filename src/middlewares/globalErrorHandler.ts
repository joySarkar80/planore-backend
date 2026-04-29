/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import config from '../config';
import AppError from '../errors/AppError';
import handlePrismaError from '../errors/handlePrismaError';
import handlePrismaValidationError from '../errors/handlePrismaValidationError';
import handleZodError from '../errors/handleZodError';
// import { TErrorSources } from '../interface/error';
import { TErrorSources } from '../interface/error.interface';

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    // Setting default values
    let statusCode = 500;
    let message = 'Something went wrong!';
    let errorSources: TErrorSources = [
        {
            path: '',
            message: 'Something went wrong',
        },
    ];

    // Zod validation errors
    if (err instanceof ZodError) {
        const simplifiedError = handleZodError(err);
        statusCode = simplifiedError?.statusCode;
        message = simplifiedError?.message;
        errorSources = simplifiedError?.errorSources;
    }
    // Prisma Known Request Errors (constraint violations, not found, etc.)
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const simplifiedError = handlePrismaError(err);
        statusCode = simplifiedError?.statusCode;
        message = simplifiedError?.message;
        errorSources = simplifiedError?.errorSources;
    }
    // Prisma Validation Errors (schema mismatch)
    else if (err instanceof Prisma.PrismaClientValidationError) {
        const simplifiedError = handlePrismaValidationError(err);
        statusCode = simplifiedError?.statusCode;
        message = simplifiedError?.message;
        errorSources = simplifiedError?.errorSources;
    }
    // Prisma Initialization Error
    else if (err instanceof Prisma.PrismaClientInitializationError) {
        statusCode = 503;
        message = 'Database Connection Error';
        errorSources = [
            {
                path: '',
                message: 'Unable to connect to the database',
            },
        ];
    }
    // Custom App Error
    else if (err instanceof AppError) {
        statusCode = err?.statusCode;
        message = err.message;
        errorSources = [
            {
                path: '',
                message: err?.message,
            },
        ];
    }






    // Generic Error
    else if (err instanceof Error) {
        message = err.message;
        errorSources = [
            {
                path: '',
                message: err?.message,
            },
        ];
    }

    // Ultimate return
    return res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err,
        stack: config.NODE_ENV === 'development' ? err?.stack : null,
    });
};

export default globalErrorHandler;

/*
Response Pattern:
{
  success: false,
  message: "Error message",
  errorSources: [
    {
      path: "field_name",
      message: "Specific error message"
    }
  ],
  stack: "..." // Only in development
}
*/