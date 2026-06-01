import { TemplatesController } from './template.service';

export * from './template.service';

export {
  QueryBuilder,
  GetRequest,
  DeleteRequest,
  DeleteResponse,
  RequestContext,
  Empty,
} from './common.message';

export {
  TemplateEngine,
  Template,
  TemplateVersion,
  OrgTemplateOverride,
  OrgTemplateOverrideVersion,
} from './template.model';

export {
  CreateTemplateRequest,
  UpdateTemplateRequest,
  GetTemplateResponse,
  ListTemplatesRequest,
  ListTemplatesResponse,
  ListTemplateVersionsRequest,
  ListTemplateVersionsResponse,
  RevertTemplateRequest,
  RenderTemplateRequest,
  RenderTemplateResponse,
} from './template.message';

export {
  UpsertOrgOverrideRequest,
  GetOrgOverrideRequest,
  GetOrgOverrideResponse,
  DeleteOrgOverrideRequest,
  ListOrgOverridesRequest,
  ListOrgOverridesResponse,
  ListOrgOverrideVersionsRequest,
  ListOrgOverrideVersionsResponse,
  RevertOrgOverrideRequest,
} from './org-override.message';

// Narrow controller interfaces — one per gRPC resource group
export type ITemplatesController = Pick<
  TemplatesController,
  | 'createTemplate'
  | 'getTemplate'
  | 'updateTemplate'
  | 'deleteTemplate'
  | 'listTemplates'
  | 'listTemplateVersions'
  | 'revertTemplate'
  | 'upsertOrgOverride'
  | 'getOrgOverride'
  | 'deleteOrgOverride'
  | 'listOrgOverrides'
  | 'listOrgOverrideVersions'
  | 'revertOrgOverride'
  | 'renderTemplate'
>;
