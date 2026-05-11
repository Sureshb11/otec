import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let errorCode: string | undefined;

    if (isHttp) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        message = (b.message as string | string[]) ?? exception.message;
        errorCode = b.error as string | undefined;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
    }

    const stack = exception instanceof Error ? exception.stack : undefined;
    if (status >= 500) {
      this.logger.error(
        `${request.url} -> ${status}: ${Array.isArray(message) ? message.join('; ') : message}`,
        stack,
      );
    }

    const payload: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };
    if (errorCode) payload.error = errorCode;
    if (process.env.NODE_ENV !== 'production' && stack) payload.stack = stack;

    response.status(status).json(payload);
  }
}
