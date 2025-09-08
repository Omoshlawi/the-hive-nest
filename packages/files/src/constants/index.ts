import path from 'path';
import { HIVE_FILES_V1_PACKAGE_NAME } from '../types';

export const FILE_HTTP_SERVER_CONFIG_TOKEN = 'FILE_HTTP_SERVER_CONFIG';
export const FILE_RPC_SERVER_CONFIG_TOKEN = 'FILE_RPC_SERVER_CONFIG';
export const FILE_PACKAGE = Object.freeze({
  V1: {
    NAME: HIVE_FILES_V1_PACKAGE_NAME,
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/files.service.proto'),
    ),
    TOKEN: 'SERVICE_FILE_PACKAGE_V1',
  },
});
export const HIVE_FILE_SERVICE_NAME = '@hive/file-service';
