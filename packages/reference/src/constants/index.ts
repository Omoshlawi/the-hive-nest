import path from 'path';
import { HIVE_REFERENCE_V1_PACKAGE_NAME } from '../types';

export const REFERENCE_HTTP_SERVER_CONFIG_TOKEN =
  'REFERENCE_HTTP_SERVER_CONFIG';
export const REFERENCE_RPC_SERVER_CONFIG_TOKEN = 'REFERENCE_RPC_SERVER_CONFIG';
export const REFERENCE_PACKAGE = Object.freeze({
  V1: {
    NAME: HIVE_REFERENCE_V1_PACKAGE_NAME,
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/reference.service.proto'),
    ),
    TOKEN: 'SERVICE_REFERENCE_PACKAGE_V1',
  },
});
export const HIVE_REFERENCE_SERVICE_NAME = '@hive/reference-service';
