import { Prisma } from '../../generated/prisma/client';
import { TErrorSources, TGenericErrorResponse } from '../interface/error.interface';
// import { TErrorSources, TGenericErrorResponse } from '../interface/error';

/**
 * Handles Prisma Client Known Request Errors
 * These include constraint violations, record not found, etc.
 */
const handlePrismaError = (
    err: Prisma.PrismaClientKnownRequestError,
): TGenericErrorResponse => {
    let statusCode = 400;
    let message = 'Database Error';
    let errorSources: TErrorSources = [];

    switch (err.code) {
        // Unique constraint violation
        case 'P2002': {
            const target = (err.meta?.target as string[]) || [];
            const field = target.join(', ');
            statusCode = 409;
            message = 'Duplicate Entry';
            errorSources = [
                {
                    path: field,
                    message: `${field} already exists`,
                },
            ];
            break;
        }

        // Foreign key constraint failed
        case 'P2003': {
            const field = (err.meta?.field_name as string) || 'field';
            statusCode = 400;
            message = 'Foreign Key Constraint Failed';
            errorSources = [
                {
                    path: field,
                    message: `Invalid reference: ${field}`,
                },
            ];
            break;
        }

        // Record not found
        case 'P2025': {
            statusCode = 404;
            message = 'Record Not Found';
            errorSources = [
                {
                    path: '',
                    message: (err.meta?.cause as string) || 'The requested record does not exist',
                },
            ];
            break;
        }

        // Invalid ID format (e.g., invalid UUID)
        case 'P2023': {
            statusCode = 400;
            message = 'Invalid ID';
            errorSources = [
                {
                    path: 'id',
                    message: 'Invalid ID format provided',
                },
            ];
            break;
        }

        // Required field missing
        case 'P2011': {
            const field = (err.meta?.constraint as string) || 'field';
            statusCode = 400;
            message = 'Required Field Missing';
            errorSources = [
                {
                    path: field,
                    message: `${field} is required`,
                },
            ];
            break;
        }

        // Default case for other Prisma errors
        default: {
            errorSources = [
                {
                    path: '',
                    message: err.message,
                },
            ];
        }
    }

    return {
        statusCode,
        message,
        errorSources,
    };
};

export default handlePrismaError;