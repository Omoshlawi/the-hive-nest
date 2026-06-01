import {
  CreateTemplateRequest,
  DeleteOrgOverrideRequest,
  DeleteRequest,
  GetOrgOverrideRequest,
  GetOrgOverrideResponse,
  GetRequest,
  GetTemplateResponse,
  ITemplatesController,
  ListOrgOverridesRequest,
  ListOrgOverridesResponse,
  ListOrgOverrideVersionsRequest,
  ListOrgOverrideVersionsResponse,
  ListTemplatesRequest,
  ListTemplatesResponse,
  ListTemplateVersionsRequest,
  ListTemplateVersionsResponse,
  RenderTemplateRequest,
  RenderTemplateResponse,
  RevertOrgOverrideRequest,
  RevertTemplateRequest,
  TEMPLATES_SERVICE_NAME,
  UpdateTemplateRequest,
  UpsertOrgOverrideRequest,
  DeleteResponse,
} from '@hive/template';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { TemplatesService } from './templates.service';

@Controller()
export class TemplatesController implements ITemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // ── Template CRUD ──────────────────────────────────────────────────────────

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'createTemplate')
  createTemplate(request: CreateTemplateRequest): Promise<GetTemplateResponse> {
    return this.templatesService.create(request);
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'getTemplate')
  async getTemplate(request: GetRequest): Promise<GetTemplateResponse> {
    const res = await this.templatesService.get(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Template not found'));
    return res;
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'updateTemplate')
  updateTemplate(request: UpdateTemplateRequest): Promise<GetTemplateResponse> {
    return this.templatesService.update(request);
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'deleteTemplate')
  deleteTemplate(request: DeleteRequest): Promise<DeleteResponse> {
    return this.templatesService.delete(request);
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'listTemplates')
  listTemplates(request: ListTemplatesRequest): Promise<ListTemplatesResponse> {
    return this.templatesService.list(
      request,
    ) as unknown as Promise<ListTemplatesResponse>;
  }

  // ── Version management ─────────────────────────────────────────────────────

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'listTemplateVersions')
  listTemplateVersions(
    request: ListTemplateVersionsRequest,
  ): Promise<ListTemplateVersionsResponse> {
    return this.templatesService.listVersions(
      request,
    ) as unknown as Promise<ListTemplateVersionsResponse>;
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'revertTemplate')
  revertTemplate(request: RevertTemplateRequest): Promise<GetTemplateResponse> {
    return this.templatesService.revert(request);
  }

  // ── Org overrides ──────────────────────────────────────────────────────────

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'upsertOrgOverride')
  upsertOrgOverride(
    request: UpsertOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    return this.templatesService.upsertOrgOverride(request);
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'getOrgOverride')
  getOrgOverride(
    request: GetOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    return this.templatesService.getOrgOverride(request);
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'deleteOrgOverride')
  deleteOrgOverride(
    request: DeleteOrgOverrideRequest,
  ): Promise<DeleteResponse> {
    return this.templatesService.deleteOrgOverride(request);
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'listOrgOverrides')
  listOrgOverrides(
    request: ListOrgOverridesRequest,
  ): Promise<ListOrgOverridesResponse> {
    return this.templatesService.listOrgOverrides(
      request,
    ) as unknown as Promise<ListOrgOverridesResponse>;
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'listOrgOverrideVersions')
  listOrgOverrideVersions(
    request: ListOrgOverrideVersionsRequest,
  ): Promise<ListOrgOverrideVersionsResponse> {
    return this.templatesService.listOrgOverrideVersions(
      request,
    ) as unknown as Promise<ListOrgOverrideVersionsResponse>;
  }

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'revertOrgOverride')
  revertOrgOverride(
    request: RevertOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    return this.templatesService.revertOrgOverride(request);
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  @GrpcMethod(TEMPLATES_SERVICE_NAME, 'renderTemplate')
  renderTemplate(
    request: RenderTemplateRequest,
  ): Promise<RenderTemplateResponse> {
    return this.templatesService.renderTemplate(
      request,
    ) as unknown as Promise<RenderTemplateResponse>;
  }
}
