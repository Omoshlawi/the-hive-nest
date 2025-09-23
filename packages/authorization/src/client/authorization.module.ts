import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OPEN_FGA_CONFIG_TOKEN } from '../constants';
import { AuthorizatioModuleOptions } from '../interface';
import { OpenFGAService } from './openfga.service';

@Module({})
export class AuthorizatioModule {
  static forRootAsync(options?: AuthorizatioModuleOptions): DynamicModule {
    return {
      global: options?.global,
      module: AuthorizatioModule,
      imports: options?.imports ?? [],
      providers: [
        OpenFGAService,
        this.createAsyncConfigProvider(options),
        ...(options?.providers ?? []),
      ],
      exports: [OpenFGAService, OPEN_FGA_CONFIG_TOKEN],
    };
  }

  static forFeature() {}

  private static createAsyncConfigProvider(
    options?: AuthorizatioModuleOptions,
  ): Provider {
    if (options?.useFactory) {
      return {
        provide: OPEN_FGA_CONFIG_TOKEN,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      };
    }

    if (options?.useClass) {
      return {
        provide: OPEN_FGA_CONFIG_TOKEN,
        useClass: options.useClass,
      };
    }

    if (options?.useExisting) {
      return {
        provide: OPEN_FGA_CONFIG_TOKEN,
        useExisting: options.useExisting,
      };
    }

    throw new Error(
      'Invalid async configuration. Must provide useFactory, useClass, or useExisting.',
    );
  }
}
