import path from 'path';
import { HIVE_PROPERTY_V1_PACKAGE_NAME } from '../types';

export const PROPERTY_HTTP_SERVER_CONFIG_TOKEN = 'PROPERTY_HTTP_SERVER_CONFIG';
export const PROPERTY_RPC_SERVER_CONFIG_TOKEN = 'PROPERTY_RPC_SERVER_CONFIG';
export const PROPERTY_PACKAGE = Object.freeze({
  V1: {
    NAME: HIVE_PROPERTY_V1_PACKAGE_NAME,
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/property.service.proto'),
    ),
    TOKEN: 'SERVICE_PROPERTY_PACKAGE_V1',
  },
});
