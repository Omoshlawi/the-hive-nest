import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
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
