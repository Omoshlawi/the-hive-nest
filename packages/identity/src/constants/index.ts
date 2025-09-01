import path from 'path';
import { HIVE_IDENTITY_V1_PACKAGE_NAME } from '../types/identity.service';

export const IDENTITY_HTTP_SERVER_CONFIG_TOKEN = 'IDENTITY_HTTP_SERVER_CONFIG';
export const IDENTITY_RPC_SERVER_CONFIG_TOKEN = 'IDENTITY_RPC_SERVER_CONFIG';
export const HIVE_IDENTITY_SERVICE_NAME = '@hive/identity-service';
export const IDENTITY_PACKAGE = Object.freeze({
  V1: {
    NAME: HIVE_IDENTITY_V1_PACKAGE_NAME,
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/identity.service.proto'),
    ),
    TOKEN: 'SERVICE_IDENTITY_PACKAGE_V1',
  },
});
/**
 * Token used to create service query using factory pattern in Identity module
 */
export const IDENTITY_SERVICE_CONFIG_TOKEN = 'IDENTITY_SERVICE_CONFIG';
