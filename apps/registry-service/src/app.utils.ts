import { ArgumentsHost, Catch, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
// TODO Move to core packageg with shared code

@Catch(RpcException)
export class RpcExceptionHandler implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    const error: any = exception.getError();
    error.response.statusCode = error.status
    return throwError(() => new RpcException(JSON.stringify(error.response)));
  }
}
