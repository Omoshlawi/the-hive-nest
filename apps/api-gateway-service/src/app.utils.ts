import {
  ArgumentsHost,
  CallHandler,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { catchError, Observable, throwError } from 'rxjs';
import z from 'zod';
// TODO Move to core packageg with shared code
@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      errors: z.formatError(exception.getZodError() as any),
    });
  }
}

@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        try {
          const {
            error: _,
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
            ...errorDetails
          } = JSON.parse(error.details);
          errorDetails.statusCode = statusCode;
          return throwError(() => new HttpException(errorDetails, statusCode));
        } catch (_) {
          // TODO: log the error apropriately
          return throwError(() => new InternalServerErrorException());
        }
      }),
    );
  }
}
