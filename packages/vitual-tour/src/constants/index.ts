import path from 'path';
import { HIVE_VIRTUALTOUR_V1_PACKAGE_NAME } from '../types';

export const VIRTUAL_TOUR_HTTP_SERVER_CONFIG_TOKEN =
  'VIRTUAL_TOUR_HTTP_SERVER_CONFIG';
export const VIRTUAL_TOUR_RPC_SERVER_CONFIG_TOKEN =
  'VIRTUAL_TOUR_RPC_SERVER_CONFIG';
export const VIRTUAL_TOUR_PACKAGE = Object.freeze({
  V1: {
    NAME: HIVE_VIRTUALTOUR_V1_PACKAGE_NAME,
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/virtual-tour.service.proto'),
    ),
    TOKEN: 'SERVICE_VIRTUAL_TOUR_PACKAGE_V1',
  },
});
export const HIVE_VIRTUAL_TOUR_SERVICE_NAME = '@hive/virtual-tour-service';
