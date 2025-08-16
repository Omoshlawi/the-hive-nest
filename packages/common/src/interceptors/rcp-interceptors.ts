import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable()
export class ClientRpcErrorInterceptor implements NestInterceptor {
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

@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        try {
          // Try to parse erro details, if success it means it rpc thrown error, else throw original error
          const {
            error: _,
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
            ...errorDetails
          } = JSON.parse(error.details);
          errorDetails.statusCode = statusCode;
          return throwError(() => new HttpException(errorDetails, statusCode));
        } catch (e) {
          // its not rpc thron exception so handle other exceptions by rethrowing it for now
          // console.log(error instanceof ZodValidationException);//true if zod validation error

          // TODO: log the error apropriately

          return throwError(() => error ?? e);
        }
      }),
    );
  }
}
