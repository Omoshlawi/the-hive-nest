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
export const SERVICE_REGISTRY_CLIENT = 'SERVICE_REGISTRY_CLIENT';
export const SERVICE_REGISTRY_PATTERNS = Object.freeze({
  SERVICES: 'registry.services',
  SERVICE_BY_NAME_AND_VERSION: 'registry.findByNameAndVersion',
  SERVICES_BY_NAME_AND_VERSION: 'registry.findAllByNameAndVersion',
  SERVICE_DEREGISTER: 'registry.deregister',
  SERVICE_HEARTBEAT: 'registry.heartbeat',
  SERVICE_HEALTH: 'registry.health',
  SERVICE_REGISTER: 'registry.register',
});
