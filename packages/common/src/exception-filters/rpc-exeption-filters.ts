import {
  ArgumentsHost,
  Catch,
  RpcExceptionFilter as NestRpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ServerRpcException } from '../exceptions';
import { Observable, throwError } from 'rxjs';

/**
 * RCP Exception Handler for RCP Server
 * Handle RCP Exceptions raised in RCP Server
 */
@Catch(ServerRpcException)
export class ServerRpcExceptionFilter
  implements NestRpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    const error: any = exception.getError();
    error.response.statusCode = error.status;
    return throwError(() => new RpcException(JSON.stringify(error.response)));
  }
}

@Catch(RpcException)
export class RpcExceptionFilter
  implements NestRpcExceptionFilter<RpcException>
{
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    const error: any = exception.getError();
    error.response.statusCode = error.status;
    return throwError(() => new RpcException(JSON.stringify(error.response)));
  }
}
