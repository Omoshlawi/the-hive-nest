import { applyDecorators, SetMetadata } from '@nestjs/common';
import { HIVE_SERVICE_METADATA_TOKEN } from '../constants';
import { HiveServiceConfig } from '../interfaces';

/**
 * Marks a class as a Hive gRPC service client and attaches its discovery
 * configuration as class-level metadata.
 *
 * `HiveServiceModule.forFeature()` reads this metadata via the NestJS
 * `Reflector` to construct a `HiveServiceClient` instance and inject it
 * into the decorated class at module initialization time.
 *
 * @param config - gRPC package name, proto path, service name, and registry
 *   identifier for this client. These values must match the corresponding
 *   domain service's proto definitions and registry registration.
 *
 * @example
 * \@HiveService({
 *   package: PROPERTY_PACKAGE.V1.NAME,
 *   protoPath: PROPERTY_PACKAGE.V1.PROTO_PATH,
 *   name: HIVE_PROPERTY_SERVICE_NAME,
 *   serviceName: PROPERTIES_SERVICE_NAME,
 *   version: '0.0.1',
 * })
 * export class HivePropertyServiceClient { ... }
 */
export function HiveService(config: HiveServiceConfig) {
  return applyDecorators(SetMetadata(HIVE_SERVICE_METADATA_TOKEN, config));
}
