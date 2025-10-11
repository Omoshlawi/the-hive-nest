/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiListResponse<T> {
  results: Array<T>;
}

@Injectable()
export class ApiListTransformInterceptor<T>
  implements NestInterceptor<T, ApiListResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiListResponse<T>> {
    return next.handle().pipe(
      map((data: Record<string, any>) => {
        return {
          results: data?.data ?? [],
          ...(JSON.parse(data.metadata) as unknown as Record<string, any>),
        };
      }),
    );
  }
}

@Injectable()
export class ApiDetailTransformInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: Record<string, any>) => {
        return data?.data as Record<string, any>;
      }),
    );
  }
}
