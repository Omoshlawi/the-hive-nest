import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { RpcErrorInterceptor } from '../interceptors';
import {
  RpcExceptionFilter,
  ZodValidationExceptionFilter,
} from '../exception-filters';
import { ZodValidationPipe } from 'nestjs-zod';
import { Provider } from '@nestjs/common';

export const GlobalZodValidationPipe: Provider = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};

export const GlobalRpcExceptionFilter: Provider = {
  provide: APP_FILTER,
  useClass: RpcExceptionFilter,
};

export const GlobalZodExceptionFilter: Provider = {
  provide: APP_FILTER,
  useClass: ZodValidationExceptionFilter,
};

export const GlobalRpcExceptionInterceptor: Provider = {
  provide: APP_INTERCEPTOR,
  useClass: RpcErrorInterceptor,
};
