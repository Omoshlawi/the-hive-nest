/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HiveService, HiveServiceClient } from '@hive/registry';
import { HIVE_TEMPLATE_SERVICE_NAME, TEMPLATE_PACKAGE } from '../constants';
import {
  CreateTemplateRequest,
  DeleteOrgOverrideRequest,
  DeleteRequest,
  GetOrgOverrideRequest,
  GetOrgOverrideResponse,
  GetRequest,
  GetTemplateResponse,
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
  TemplatesClient,
  UpdateTemplateRequest,
  UpsertOrgOverrideRequest,
  DeleteResponse,
} from '../types';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';

@HiveService({
  package: TEMPLATE_PACKAGE.V1.NAME,
  protoPath: TEMPLATE_PACKAGE.V1.PROTO_PATH,
  version: '0.0.1',
  serviceName: TEMPLATES_SERVICE_NAME,
  name: HIVE_TEMPLATE_SERVICE_NAME,
})
export class HiveTemplateClientService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private client: HiveServiceClient) {}

  private loadBalance() {
    return this.client.loadBalance<TemplatesClient>();
  }

  readonly templates = {
    createTemplate: (
      request: CreateTemplateRequest,
    ): Observable<GetTemplateResponse> =>
      this.loadBalance().createTemplate(request),
    getTemplate: (request: GetRequest): Observable<GetTemplateResponse> =>
      this.loadBalance().getTemplate(request),
    updateTemplate: (
      request: UpdateTemplateRequest,
    ): Observable<GetTemplateResponse> =>
      this.loadBalance().updateTemplate(request),
    deleteTemplate: (request: DeleteRequest): Observable<DeleteResponse> =>
      this.loadBalance().deleteTemplate(request),
    listTemplates: (
      request: ListTemplatesRequest,
    ): Observable<ListTemplatesResponse> =>
      this.loadBalance().listTemplates(request),
    listTemplateVersions: (
      request: ListTemplateVersionsRequest,
    ): Observable<ListTemplateVersionsResponse> =>
      this.loadBalance().listTemplateVersions(request),
    revertTemplate: (
      request: RevertTemplateRequest,
    ): Observable<GetTemplateResponse> =>
      this.loadBalance().revertTemplate(request),
  };

  readonly orgOverrides = {
    upsertOrgOverride: (
      request: UpsertOrgOverrideRequest,
    ): Observable<GetOrgOverrideResponse> =>
      this.loadBalance().upsertOrgOverride(request),
    getOrgOverride: (
      request: GetOrgOverrideRequest,
    ): Observable<GetOrgOverrideResponse> =>
      this.loadBalance().getOrgOverride(request),
    deleteOrgOverride: (
      request: DeleteOrgOverrideRequest,
    ): Observable<DeleteResponse> =>
      this.loadBalance().deleteOrgOverride(request),
    listOrgOverrides: (
      request: ListOrgOverridesRequest,
    ): Observable<ListOrgOverridesResponse> =>
      this.loadBalance().listOrgOverrides(request),
    listOrgOverrideVersions: (
      request: ListOrgOverrideVersionsRequest,
    ): Observable<ListOrgOverrideVersionsResponse> =>
      this.loadBalance().listOrgOverrideVersions(request),
    revertOrgOverride: (
      request: RevertOrgOverrideRequest,
    ): Observable<GetOrgOverrideResponse> =>
      this.loadBalance().revertOrgOverride(request),
  };

  readonly render = {
    renderTemplate: (
      request: RenderTemplateRequest,
    ): Observable<RenderTemplateResponse> =>
      this.loadBalance().renderTemplate(request),
  };

  onModuleInit() {
    return this.client.onModuleInit();
  }

  onModuleDestroy() {
    return this.client.onModuleDestroy();
  }
}
