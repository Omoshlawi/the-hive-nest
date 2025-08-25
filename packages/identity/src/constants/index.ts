import path from 'path';
import { protobufPackage } from '../types/identity.service';

export const IDENTITY_HTTP_SERVER_CONFIG_TOKEN = 'IDENTITY_HTTP_SERVER_CONFIG';
export const IDENTITY_RPC_SERVER_CONFIG_TOKEN = 'IDENTITY_RPC_SERVER_CONFIG';
export const HIVE_IDENTITY_SERVICE_NAME = '@hive/identity-service';
export const IDENTITY_PACKAGE = Object.freeze({
  V1: {
    NAME: protobufPackage,
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/identity.service.proto'),
    ),
    TOKEN: 'SERVICE_IDENTITY_PACKAGE_V1',
  },
});
