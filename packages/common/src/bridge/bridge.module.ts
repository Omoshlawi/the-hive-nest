import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common';

export interface BridgeOptions
  extends Pick<ModuleMetadata, 'providers' | 'imports'> {
  /**
   * Whether to make this bridge global (use sparingly)
   */
  global?: boolean;
}

/**
 * A reusable module that acts as a bridge to make providers available
 * to dynamic modules with limited injection capabilities.
 */
@Module({})
export class BridgeModule {
  /**
   * Creates a bridge for making providers available to other modules
   *
   * @param options Configuration for what to import and provide
   * @returns DynamicModule configured as a provider bridge
   */
  static for(options: BridgeOptions): DynamicModule {
    const providers = options.providers || [];

    return {
      module: BridgeModule,
      global: options.global || false,
      imports: options.imports || [],
      providers,
      exports: [...providers, ...((options.imports as any) ?? [])],
    };
  }

  /**
   * Simple bridge for a list of providers
   */
  static providers(...providers: (Type<any> | Provider)[]): DynamicModule {
    return this.for({ providers });
  }
}
