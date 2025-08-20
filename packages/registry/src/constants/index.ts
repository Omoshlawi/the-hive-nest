import path from 'path';
/**
 * Validates service names that follow the pattern: @hive/<name>-service
 *
 * ✅ Examples that pass:
 * - @hive/auth-service
 * - @hive/user-auth-service
 * - @hive/data-sync-service
 *
 * ❌ Examples that fail:
 * - @hive/Auth-service        // contains uppercase letters
 * - @hive/user_auth-service  // contains underscore
 * - @hive/user-auth          // missing '-service' suffix
 */
export const SERVICE_NAME_REGEX = /^@hive\/[a-z]+(-[a-z]+)*-service$/;

// Export package information
export const REGISTRY_PACKAGE = Object.freeze({
  V1: {
    NAME: 'hive.registry.v1',
    PROTO_PATH: require.resolve(
      path.join(__dirname, '../proto/registry.service.proto'),
    ),
    TOKEN: 'SERVICE_REGISTRY_PACKAGE_V1',
  },
});

export const CLIENT_SERVICE_CONFIG_TOKEN = 'CLIENT_SERVICE_CONFIG';
