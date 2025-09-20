import { Logger } from '@nestjs/common';
import {
  ClientCheckRequest,
  ClientListObjectsRequest,
  OpenFgaClient,
} from '@openfga/sdk';
import { AuthorizationConfig } from 'config/authorization.config';

export abstract class BaseAuthorizationService {
  protected abstract servicePrefix: string;
  protected fgaClient: OpenFgaClient;
  protected logger: Logger;

  constructor(config: AuthorizationConfig) {
    this.fgaClient = new OpenFgaClient({
      apiUrl: config.fgaApiUrl,
      storeId: config.fgaStoreId,
      authorizationModelId: config.fgaModelId,
    });
    this.logger = new Logger(this.constructor.name);
  }

  protected getResourceType(resourceType: string): string {
    return `${this.servicePrefix}:${resourceType}`;
  }

  /**
   * Checks whether a user has a specific relation to an object.
   *
   * @param user - The user identifier (e.g., "user:123").
   * @param relation - The relation to check (e.g., "viewer", "editor").
   * @param object - The object identifier (e.g., "organization:456").
   * @param options - Optional context or contextual tuples for the check.
   * @returns A promise that resolves to a boolean indicating whether the user is allowed.
   */

  async check(
    user: string,
    relation: string,
    object: string,
    options?: Pick<ClientCheckRequest, 'context' | 'contextualTuples'>,
  ): Promise<boolean> {
    try {
      const response = await this.fgaClient.check({
        ...options,
        user,
        relation,
        object,
      });
      return response.allowed ?? false;
    } catch (error) {
      this.logger.error('Authorization check failed:', error);
      return false;
    }
  }
  /**
   * Performs batch authorization checks for multiple user-relation-object combinations.
   *
   * @param checks An array of objects, each containing:
   *   - user: The user identifier (e.g., "user:123").
   *   - relation: The relation to check (e.g., "viewer", "editor").
   *   - object: The object identifier (e.g., "organization:456").
   * @param options Optional context or contextual tuples for the checks.
   * @returns A promise that resolves to an array of booleans, each indicating whether the corresponding check is allowed.
   */

  async batchCheck(
    checks: Array<{ user: string; relation: string; object: string }>,
    options?: Pick<ClientCheckRequest, 'context' | 'contextualTuples'>,
  ): Promise<boolean[]> {
    // Implement batch checking for performance
    const results = await Promise.all(
      checks.map((check) =>
        this.check(check.user, check.relation, check.object, options),
      ),
    );
    return results;
  }

  /**
   * Lists the object IDs of a given type that the user has a specific relation to.
   *
   * @param user The user identifier (e.g., "user:123").
   * @param relation The relation to check (e.g., "viewer", "editor").
   * @param type The resource type (e.g., "organization:property").
   * @param options Optional context or contextual tuples for the check.
   * @returns A promise that resolves to an array of object IDs the user has the relation to.
   */
  async listObjects(
    user: string,
    relation: string,
    type: string,
    options?: Pick<ClientListObjectsRequest, 'context' | 'contextualTuples'>,
  ): Promise<string[]> {
    try {
      const response = await this.fgaClient.listObjects({
        ...options,
        user,
        relation,
        type,
      });
      return response.objects || [];
    } catch (error) {
      this.logger.error('List objects failed:', error);
      return [];
    }
  }

  /**
   * Adds a relationship tuple to the authorization store.
   * @param user The user identifier (e.g., "user:123").
   * @param relation The relation (e.g., "member").
   * @param object The object identifier (e.g., "organization:456").
   */
  async addRelationshipTuple(
    user: string,
    relation: string,
    object: string,
  ): Promise<boolean> {
    try {
      await this.fgaClient.write({
        writes: [
          {
            user,
            relation,
            object,
          },
        ],
      });
      return true;
    } catch (error) {
      this.logger.error('Add relationship tuple failed:', error);
      return false;
    }
  }

  /**
   * Removes a relationship tuple from the authorization store.
   * @param user The user identifier (e.g., "user:123").
   * @param relation The relation (e.g., "member").
   * @param object The object identifier (e.g., "organization:456").
   */
  async removeRelationshipTuple(
    user: string,
    relation: string,
    object: string,
  ): Promise<boolean> {
    try {
      await this.fgaClient.write({
        deletes: [
          {
            user,
            relation,
            object,
          },
        ],
      });
      return true;
    } catch (error) {
      this.logger.error('Remove relationship tuple failed:', error);
      return false;
    }
  }
}
