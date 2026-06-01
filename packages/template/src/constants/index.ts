import path from 'path';
import { HIVE_TEMPLATE_V1_PACKAGE_NAME } from '../types';

export const TEMPLATE_HTTP_SERVER_CONFIG_TOKEN = 'TEMPLATE_HTTP_SERVER_CONFIG';
export const TEMPLATE_RPC_SERVER_CONFIG_TOKEN = 'TEMPLATE_RPC_SERVER_CONFIG';

export const TEMPLATE_PACKAGE = Object.freeze({
  V1: {
    NAME: HIVE_TEMPLATE_V1_PACKAGE_NAME,
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/template.service.proto'),
    ),
    TOKEN: 'SERVICE_TEMPLATE_PACKAGE_V1',
  },
});

export const HIVE_TEMPLATE_SERVICE_NAME = '@hive/template-service';
