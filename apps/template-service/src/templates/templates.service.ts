import {
  CreateTemplateRequest,
  DeleteRequest,
  GetRequest,
  GetTemplateResponse,
  ListTemplatesRequest,
  ListTemplateVersionsRequest,
  RenderTemplateRequest,
  RevertTemplateRequest,
  UpdateTemplateRequest,
  UpsertOrgOverrideRequest,
  GetOrgOverrideRequest,
  DeleteOrgOverrideRequest,
  ListOrgOverridesRequest,
  ListOrgOverrideVersionsRequest,
  RevertOrgOverrideRequest,
  GetOrgOverrideResponse,
  DeleteResponse,
} from '@hive/template';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesRenderer } from './templates.renderer';
import type {
  Template,
  OrgTemplateOverride,
  Prisma,
} from '../../generated/prisma/client';
import { TemplateEngine } from '../../generated/prisma/client';

// JSON fields in Prisma use a complex union type (NullableJsonNullValueInput | InputJsonValue).
// We use `as any` for JSON assignments — values are structurally validated at render time by Handlebars.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: TemplatesRenderer,
  ) {}

  // ── Template CRUD ──────────────────────────────────────────────────────────

  async create(req: CreateTemplateRequest): Promise<GetTemplateResponse> {
    const data = await this.prisma.template.create({
      data: {
        key: req.key,
        type: req.type,
        name: req.name,
        description: req.description,
        engine: TemplateEngine.HANDLEBARS,
        slots: req.slots as JsonInput,
        schema: req.schema ? (req.schema as JsonInput) : undefined,
        metadata: req.metadata ? (req.metadata as JsonInput) : undefined,
      },
    });
    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  async get(req: GetRequest): Promise<GetTemplateResponse> {
    const data = await this.prisma.template.findUnique({
      where: { id: req.id },
    });
    if (!data) throw new RpcException(`Template not found: ${req.id}`);
    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  async update(req: UpdateTemplateRequest): Promise<GetTemplateResponse> {
    const existing = await this.prisma.template.findUnique({
      where: { id: req.id },
    });
    if (!existing) throw new RpcException(`Template not found: ${req.id}`);

    // Snapshot current state before applying changes
    await this.prisma.templateVersion.create({
      data: {
        templateId: existing.id,
        version: existing.version,
        slots: existing.slots as JsonInput,
        schema: existing.schema ? (existing.schema as JsonInput) : undefined,
        metadata: existing.metadata
          ? (existing.metadata as JsonInput)
          : undefined,
        changedById: req.context?.userId,
        changeNote: req.changeNote,
      },
    });

    const data = await this.prisma.template.update({
      where: { id: req.id },
      data: {
        name: req.name ?? existing.name,
        description: req.description ?? existing.description,
        slots: (req.slots ?? JSON.stringify(existing.slots)) as JsonInput,
        schema: (req.schema !== undefined
          ? req.schema
          : existing.schema
            ? JSON.stringify(existing.schema)
            : null) as JsonInput,
        metadata: (req.metadata !== undefined
          ? req.metadata
          : existing.metadata
            ? JSON.stringify(existing.metadata)
            : null) as JsonInput,
        version: { increment: 1 },
      },
    });

    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  async delete(req: DeleteRequest): Promise<DeleteResponse> {
    const existing = await this.prisma.template.findUnique({
      where: { id: req.id },
    });
    if (!existing) throw new RpcException(`Template not found: ${req.id}`);

    if (req.purge) {
      await this.prisma.template.delete({ where: { id: req.id } });
    } else {
      await this.prisma.template.update({
        where: { id: req.id },
        data: { voided: true },
      });
    }
    return { success: true };
  }

  async list(req: ListTemplatesRequest) {
    const where: Prisma.TemplateWhereInput = {
      voided: req.includeVoided ? undefined : false,
      type: req.type ?? undefined,
    };
    const totalCount = await this.prisma.template.count({ where });
    const page = req.queryBuilder?.page ?? 1;
    const limit = req.queryBuilder?.limit ?? 20;
    const data = await this.prisma.template.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: req.queryBuilder?.orderBy
        ? { [req.queryBuilder.orderBy]: 'asc' }
        : { createdAt: 'desc' },
    });
    return {
      data: data.map((t) => this.serializeTemplate(t)),
      metadata: JSON.stringify({
        totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
      }),
    };
  }

  // ── Version management ─────────────────────────────────────────────────────

  async listVersions(req: ListTemplateVersionsRequest) {
    const page = req.queryBuilder?.page ?? 1;
    const limit = req.queryBuilder?.limit ?? 20;
    const [data, totalCount] = await Promise.all([
      this.prisma.templateVersion.findMany({
        where: { templateId: req.templateId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { version: 'desc' },
      }),
      this.prisma.templateVersion.count({
        where: { templateId: req.templateId },
      }),
    ]);
    return {
      data: data.map((v) => ({
        id: v.id,
        templateId: v.templateId,
        version: v.version,
        slots: JSON.stringify(v.slots),
        schema: v.schema ? JSON.stringify(v.schema) : undefined,
        metadata: v.metadata ? JSON.stringify(v.metadata) : undefined,
        changedById: v.changedById ?? undefined,
        changeNote: v.changeNote ?? undefined,
        createdAt: v.createdAt.toISOString(),
      })),
      metadata: JSON.stringify({ totalCount }),
    };
  }

  async revert(req: RevertTemplateRequest): Promise<GetTemplateResponse> {
    const [target, existing] = await Promise.all([
      this.prisma.templateVersion.findUnique({ where: { id: req.versionId } }),
      this.prisma.template.findUnique({ where: { id: req.templateId } }),
    ]);
    if (!target) throw new RpcException(`Version not found: ${req.versionId}`);
    if (!existing)
      throw new RpcException(`Template not found: ${req.templateId}`);

    // Snapshot current state so the revert itself is in the history
    await this.prisma.templateVersion.create({
      data: {
        templateId: existing.id,
        version: existing.version,
        slots: existing.slots as JsonInput,
        schema: existing.schema ? (existing.schema as JsonInput) : undefined,
        metadata: existing.metadata
          ? (existing.metadata as JsonInput)
          : undefined,
        changedById: req.context?.userId,
        changeNote: req.changeNote ?? `Reverted to version ${target.version}`,
      },
    });

    const data = await this.prisma.template.update({
      where: { id: req.templateId },
      data: {
        slots: target.slots as JsonInput,
        schema: (target.schema ?? null) as JsonInput,
        metadata: (target.metadata ?? null) as JsonInput,
        version: { increment: 1 },
      },
    });

    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  // ── Org overrides ──────────────────────────────────────────────────────────

  async upsertOrgOverride(
    req: UpsertOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    const existing = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: {
          templateKey: req.templateKey,
          organizationId: req.organizationId,
        },
      },
    });

    let data: OrgTemplateOverride;

    if (existing) {
      // Snapshot before update
      await this.prisma.orgTemplateOverrideVersion.create({
        data: {
          overrideId: existing.id,
          version: existing.version,
          slots: existing.slots as JsonInput,
          metadata: existing.metadata
            ? (existing.metadata as JsonInput)
            : undefined,
          changedById: req.context?.userId,
          changeNote: req.changeNote,
        },
      });

      data = await this.prisma.orgTemplateOverride.update({
        where: { id: existing.id },
        data: {
          slots: req.slots as JsonInput,
          metadata: (req.metadata !== undefined
            ? req.metadata
            : existing.metadata
              ? JSON.stringify(existing.metadata)
              : null) as JsonInput,
          version: { increment: 1 },
        },
      });
    } else {
      data = await this.prisma.orgTemplateOverride.create({
        data: {
          templateKey: req.templateKey,
          organizationId: req.organizationId,
          slots: req.slots as JsonInput,
          metadata: req.metadata ? (req.metadata as JsonInput) : undefined,
        },
      });
    }

    return { data: this.serializeOverride(data), metadata: JSON.stringify({}) };
  }

  async getOrgOverride(
    req: GetOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    const data = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: {
          templateKey: req.templateKey,
          organizationId: req.organizationId,
        },
      },
    });
    if (!data)
      throw new RpcException(
        `Override not found for key "${req.templateKey}" org "${req.organizationId}"`,
      );
    return { data: this.serializeOverride(data), metadata: JSON.stringify({}) };
  }

  async deleteOrgOverride(
    req: DeleteOrgOverrideRequest,
  ): Promise<DeleteResponse> {
    const existing = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: {
          templateKey: req.templateKey,
          organizationId: req.organizationId,
        },
      },
    });
    if (!existing) throw new RpcException(`Override not found`);

    if (req.purge) {
      await this.prisma.orgTemplateOverride.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.orgTemplateOverride.update({
        where: { id: existing.id },
        data: { voided: true },
      });
    }
    return { success: true };
  }

  async listOrgOverrides(req: ListOrgOverridesRequest) {
    const where: Prisma.OrgTemplateOverrideWhereInput = {
      organizationId: req.organizationId,
      voided: req.includeVoided ? undefined : false,
    };
    const page = req.queryBuilder?.page ?? 1;
    const limit = req.queryBuilder?.limit ?? 20;
    const [data, totalCount] = await Promise.all([
      this.prisma.orgTemplateOverride.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orgTemplateOverride.count({ where }),
    ]);
    return {
      data: data.map((o) => this.serializeOverride(o)),
      metadata: JSON.stringify({
        totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
      }),
    };
  }

  async listOrgOverrideVersions(req: ListOrgOverrideVersionsRequest) {
    const page = req.queryBuilder?.page ?? 1;
    const limit = req.queryBuilder?.limit ?? 20;
    const [data, totalCount] = await Promise.all([
      this.prisma.orgTemplateOverrideVersion.findMany({
        where: { overrideId: req.overrideId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { version: 'desc' },
      }),
      this.prisma.orgTemplateOverrideVersion.count({
        where: { overrideId: req.overrideId },
      }),
    ]);
    return {
      data: data.map((v) => ({
        id: v.id,
        overrideId: v.overrideId,
        version: v.version,
        slots: JSON.stringify(v.slots),
        metadata: v.metadata ? JSON.stringify(v.metadata) : undefined,
        changedById: v.changedById ?? undefined,
        changeNote: v.changeNote ?? undefined,
        createdAt: v.createdAt.toISOString(),
      })),
      metadata: JSON.stringify({ totalCount }),
    };
  }

  async revertOrgOverride(
    req: RevertOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    const [target, existing] = await Promise.all([
      this.prisma.orgTemplateOverrideVersion.findUnique({
        where: { id: req.versionId },
      }),
      this.prisma.orgTemplateOverride.findUnique({
        where: { id: req.overrideId },
      }),
    ]);
    if (!target)
      throw new RpcException(`Override version not found: ${req.versionId}`);
    if (!existing)
      throw new RpcException(`Override not found: ${req.overrideId}`);

    await this.prisma.orgTemplateOverrideVersion.create({
      data: {
        overrideId: existing.id,
        version: existing.version,
        slots: existing.slots as JsonInput,
        metadata: existing.metadata
          ? (existing.metadata as JsonInput)
          : undefined,
        changedById: req.context?.userId,
        changeNote: req.changeNote ?? `Reverted to version ${target.version}`,
      },
    });

    const data = await this.prisma.orgTemplateOverride.update({
      where: { id: req.overrideId },
      data: {
        slots: target.slots as JsonInput,
        metadata: (target.metadata ?? null) as JsonInput,
        version: { increment: 1 },
      },
    });

    return { data: this.serializeOverride(data), metadata: JSON.stringify({}) };
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  async renderTemplate(req: RenderTemplateRequest) {
    const template = await this.prisma.template.findUnique({
      where: { key: req.key, voided: false },
    });
    if (!template) throw new RpcException(`Template not found: ${req.key}`);

    let override: OrgTemplateOverride | null = null;
    if (req.organizationId) {
      override = await this.prisma.orgTemplateOverride.findUnique({
        where: {
          templateKey_organizationId: {
            templateKey: req.key,
            organizationId: req.organizationId,
          },
          voided: false,
        },
      });
    }

    const templateSlots = this.renderer.parseSlots(
      JSON.stringify(template.slots),
    );
    const overrideSlots = override
      ? this.renderer.parseSlots(JSON.stringify(override.slots))
      : null;
    const templateMeta = this.renderer.parseMetadata(
      template.metadata ? JSON.stringify(template.metadata) : null,
    );
    const overrideMeta = override?.metadata
      ? this.renderer.parseMetadata(JSON.stringify(override.metadata))
      : null;
    const variables = this.renderer.parseVariables(req.variables);

    const { renderedSlots, metadata } = this.renderer.render(
      templateSlots,
      overrideSlots,
      templateMeta,
      overrideMeta,
      variables,
    );

    return { renderedSlots, metadata: JSON.stringify(metadata) };
  }

  // ── Serialization helpers ──────────────────────────────────────────────────

  private serializeTemplate(t: Template) {
    return {
      id: t.id,
      key: t.key,
      type: t.type,
      name: t.name,
      description: t.description ?? undefined,
      engine: 0 as const, // HANDLEBARS
      slots: JSON.stringify(t.slots),
      schema: t.schema ? JSON.stringify(t.schema) : undefined,
      metadata: t.metadata ? JSON.stringify(t.metadata) : undefined,
      version: t.version,
      voided: t.voided,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private serializeOverride(o: OrgTemplateOverride) {
    return {
      id: o.id,
      templateKey: o.templateKey,
      organizationId: o.organizationId,
      slots: JSON.stringify(o.slots),
      metadata: o.metadata ? JSON.stringify(o.metadata) : undefined,
      version: o.version,
      voided: o.voided,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }
}
