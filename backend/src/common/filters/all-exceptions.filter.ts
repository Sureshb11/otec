import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof Error ? exception.message : 'Internal server error';
        const stack = exception instanceof Error ? exception.stack : null;

        console.error('🔥 EXCEPTION CAUGHT:', {
            status,
            message,
            stack,
            path: request.url,
        });

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message,
            stack: process.env.NODE_ENV !== 'production' ? stack : stack, // Always show for now
        });
    }
}
