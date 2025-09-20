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
}
