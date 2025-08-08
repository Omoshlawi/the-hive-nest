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
