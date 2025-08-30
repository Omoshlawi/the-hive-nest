import { applyDecorators, SetMetadata } from '@nestjs/common';
import { HIVE_SERVICE_METADATA_KEY } from '../constants';
import { HiveServiceConfig } from '../interfaces';

/**
 * Decorator to mark a class as a Hive service client
 * @param config Service discovery and connection configuration
 */
export function HiveService(config: HiveServiceConfig) {
  return applyDecorators(SetMetadata(HIVE_SERVICE_METADATA_KEY, config));
}
