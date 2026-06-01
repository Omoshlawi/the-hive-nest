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
  TemplateEngine, // gRPC enum (number) — used in serialization
} from '@hive/template';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesRenderer } from './templates.renderer';
import type {
  Template,
  OrgTemplateOverride,
  Prisma,
} from '../../generated/prisma/client';
import { TemplateEngine as PrismaEngine } from '../../generated/prisma/client'; // Prisma enum (string) — used in DB writes

/**
 * Prisma JSON fields accept `InputJsonValue | NullableJsonNullValueInput`, a complex
 * union that is hard to satisfy with strongly-typed objects coming from gRPC. We use
 * `any` here because JSON values are structurally validated at render time by Handlebars.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonInput = any;

/** In-memory cache entry for a resolved (template + optional org override) pair. */
interface ResolvedTemplate {
  template: Template;
  /** `null` means "checked the DB, no override exists for this org". */
  override: OrgTemplateOverride | null;
  cachedAt: number;
}

/**
 * How long (ms) a resolved template is cached in memory before the next render call
 * re-fetches from the DB. Template content changes infrequently — 5 minutes is a safe
 * balance between freshness and DB load.
 *
 * In a multi-instance deployment each instance has its own cache. Mutations on one
 * instance invalidate that instance's cache only; other instances serve stale data for
 * up to this TTL. Reduce it or replace with a shared Redis cache for stricter consistency.
 */
const RENDER_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Core service for template CRUD, versioning, org override management, and rendering.
 *
 * **Key design decisions:**
 *
 * - **Atomic versioning** — every content-changing mutation (`update`, `revert`,
 *   `upsertOrgOverride`, `revertOrgOverride`) wraps the version snapshot and the
 *   parent-row update in a single `$transaction`. If the update fails, no orphaned
 *   version row is written.
 *
 * - **Forward-only revert** — reverting to a past version is itself a new version.
 *   The current state is snapshotted first, then the target version's content is
 *   applied. No version is ever deleted or mutated.
 *
 * - **Render cache** — `renderTemplate` caches the resolved `(template, override)` pair
 *   in memory per `key:orgId` for {@link RENDER_CACHE_TTL_MS}. Any mutation that
 *   changes template or override content invalidates the relevant cache entries.
 *
 * - **JSON parsing** — gRPC carries `slots`, `schema`, and `metadata` as JSON strings.
 *   This service parses them with `JSON.parse` before storing in Postgres so the DB
 *   column always contains a proper JSONB value, not a double-encoded string.
 */
@Injectable()
export class TemplatesService {
  /**
   * In-memory resolution cache keyed by `key` (system-only render) or `key:orgId`
   * (org-specific render). Entries expire after {@link RENDER_CACHE_TTL_MS}.
   */
  private readonly renderCache = new Map<string, ResolvedTemplate>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: TemplatesRenderer,
  ) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Constructs a typed `RpcException` with a gRPC status code. */
  private err(code: GrpcStatus, message: string): RpcException {
    return new RpcException({ code, message });
  }

  /**
   * Throws `INVALID_ARGUMENT` if `value` is absent or blank.
   * Called at the top of every public method for required gRPC fields.
   */
  private require(value: string | undefined | null, field: string): void {
    if (!value?.trim()) {
      throw this.err(GrpcStatus.INVALID_ARGUMENT, `"${field}" is required`);
    }
  }

  /**
   * Parses a JSON string received from a gRPC field into a plain value.
   * Returns `undefined` for empty / absent input so callers can distinguish
   * "field not sent" from "field set to null".
   *
   * @throws `RpcException(INVALID_ARGUMENT)` if the string is non-empty but not valid JSON.
   */
  private parseJson(raw: string | undefined | null, field: string): unknown {
    if (!raw || raw.trim() === '') return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      throw this.err(
        GrpcStatus.INVALID_ARGUMENT,
        `Invalid JSON in field "${field}"`,
      );
    }
  }

  /**
   * Invalidates all render cache entries for a template key — both the system entry
   * (`key`) and any org-specific entries (`key:orgId`). Called after any mutation that
   * changes the system template's content.
   */
  private invalidateByKey(key: string): void {
    for (const k of this.renderCache.keys()) {
      if (k === key || k.startsWith(`${key}:`)) this.renderCache.delete(k);
    }
  }

  /**
   * Invalidates the render cache entry for a single org override.
   * Called after `upsertOrgOverride`, `deleteOrgOverride`, or `revertOrgOverride`.
   */
  private invalidateByOrg(templateKey: string, organizationId: string): void {
    this.renderCache.delete(`${templateKey}:${organizationId}`);
  }

  // ── Template CRUD ──────────────────────────────────────────────────────────

  /**
   * Creates a new system template.
   *
   * `slots`, `schema`, and `metadata` arrive as JSON strings from gRPC and are
   * parsed into JSONB values before being stored. Duplicate keys are rejected with
   * `ALREADY_EXISTS`.
   *
   * @throws `INVALID_ARGUMENT` — missing required field or invalid JSON.
   * @throws `ALREADY_EXISTS`   — a template with this key already exists.
   */
  async create(req: CreateTemplateRequest): Promise<GetTemplateResponse> {
    this.require(req.key, 'key');
    this.require(req.type, 'type');
    this.require(req.name, 'name');
    this.require(req.slots, 'slots');

    const slots = this.parseJson(req.slots, 'slots');
    const schema = this.parseJson(req.schema, 'schema');
    const metadata = this.parseJson(req.metadata, 'metadata');

    const data = await this.prisma.template
      .create({
        data: {
          key: req.key,
          type: req.type,
          name: req.name,
          description: req.description,
          engine: PrismaEngine.HANDLEBARS,
          slots: slots as JsonInput,
          schema: schema as JsonInput,
          metadata: metadata as JsonInput,
        },
      })
      .catch((e: Error) => {
        if (e.message.includes('Unique constraint')) {
          throw this.err(
            GrpcStatus.ALREADY_EXISTS,
            `Template already exists: ${req.key}`,
          );
        }
        throw e;
      });

    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  /** Fetches a single template by its UUID. @throws `NOT_FOUND` if absent. */
  async get(req: GetRequest): Promise<GetTemplateResponse> {
    this.require(req.id, 'id');
    const data = await this.prisma.template.findUnique({
      where: { id: req.id },
    });
    if (!data)
      throw this.err(GrpcStatus.NOT_FOUND, `Template not found: ${req.id}`);
    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  /**
   * Updates a template's content and atomically snapshots the previous state.
   *
   * The snapshot (new `TemplateVersion` row) and the template update are committed
   * in a single transaction. If the update fails, no orphaned version is created.
   * The template's `version` counter is incremented on every successful call.
   *
   * Fields omitted from the request are preserved from the existing record.
   * Pass an explicit empty string for `schema` or `metadata` to clear them.
   *
   * Render cache entries for this template's key are invalidated on success.
   *
   * @throws `NOT_FOUND`        — template does not exist.
   * @throws `INVALID_ARGUMENT` — missing `id` or invalid JSON.
   */
  async update(req: UpdateTemplateRequest): Promise<GetTemplateResponse> {
    this.require(req.id, 'id');

    const existing = await this.prisma.template.findUnique({
      where: { id: req.id },
    });
    if (!existing)
      throw this.err(GrpcStatus.NOT_FOUND, `Template not found: ${req.id}`);

    const newSlots =
      req.slots !== undefined
        ? this.parseJson(req.slots, 'slots')
        : existing.slots;
    const newSchema =
      req.schema !== undefined
        ? req.schema
          ? this.parseJson(req.schema, 'schema')
          : null
        : existing.schema;
    const newMetadata =
      req.metadata !== undefined
        ? req.metadata
          ? this.parseJson(req.metadata, 'metadata')
          : null
        : existing.metadata;

    // Snapshot + update are atomic — if the update fails, no orphaned version is created.
    const data = await this.prisma.$transaction(async (tx) => {
      await tx.templateVersion.create({
        data: {
          templateId: existing.id,
          version: existing.version,
          slots: existing.slots as JsonInput,
          schema: existing.schema as JsonInput,
          metadata: existing.metadata as JsonInput,
          changedById: req.context?.userId,
          changeNote: req.changeNote,
        },
      });

      return tx.template.update({
        where: { id: req.id },
        data: {
          name: req.name ?? existing.name,
          description: req.description ?? existing.description,
          slots: newSlots as JsonInput,
          schema: newSchema as JsonInput,
          metadata: newMetadata as JsonInput,
          version: { increment: 1 },
        },
      });
    });

    this.invalidateByKey(existing.key);
    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  /**
   * Soft-deletes (sets `voided = true`) or hard-deletes a template.
   *
   * Soft delete is the default — the template is hidden from `list` queries but
   * its data and version history are retained. Pass `purge: true` to physically
   * delete the row and all its version history.
   *
   * @throws `NOT_FOUND` — template does not exist.
   */
  async delete(req: DeleteRequest): Promise<DeleteResponse> {
    this.require(req.id, 'id');
    const existing = await this.prisma.template.findUnique({
      where: { id: req.id },
    });
    if (!existing)
      throw this.err(GrpcStatus.NOT_FOUND, `Template not found: ${req.id}`);

    if (req.purge) {
      await this.prisma.template.delete({ where: { id: req.id } });
    } else {
      await this.prisma.template.update({
        where: { id: req.id },
        data: { voided: true },
      });
    }

    this.invalidateByKey(existing.key);
    return { success: true };
  }

  async list(req: ListTemplatesRequest) {
    const where: Prisma.TemplateWhereInput = {
      voided: req.includeVoided ? undefined : false,
      type: req.type ?? undefined,
    };
    const page = req.queryBuilder?.page ?? 1;
    const limit = req.queryBuilder?.limit ?? 20;
    const [data, totalCount] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: req.queryBuilder?.orderBy
          ? { [req.queryBuilder.orderBy]: 'asc' }
          : { createdAt: 'desc' },
      }),
      this.prisma.template.count({ where }),
    ]);
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

  /**
   * Lists all version snapshots for a template, ordered newest-first.
   * Each row is an immutable point-in-time snapshot of the template's content.
   *
   * @throws `INVALID_ARGUMENT` — missing `templateId`.
   */
  async listVersions(req: ListTemplateVersionsRequest) {
    this.require(req.templateId, 'templateId');
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

  /**
   * Reverts a template to the content of a specific past version.
   *
   * This is a **forward-only** operation — the current state is first snapshotted as a
   * new version, then the target version's slots/schema/metadata are applied, and the
   * version counter is incremented. No version row is ever deleted or mutated.
   *
   * Both the snapshot and the content update are committed in a single transaction.
   *
   * Validates that the target version belongs to the specified template before committing.
   *
   * @throws `NOT_FOUND`        — template or version does not exist.
   * @throws `INVALID_ARGUMENT` — missing required fields or version belongs to a different template.
   */
  async revert(req: RevertTemplateRequest): Promise<GetTemplateResponse> {
    this.require(req.templateId, 'templateId');
    this.require(req.versionId, 'versionId');

    const [target, existing] = await Promise.all([
      this.prisma.templateVersion.findUnique({ where: { id: req.versionId } }),
      this.prisma.template.findUnique({ where: { id: req.templateId } }),
    ]);
    if (!target)
      throw this.err(
        GrpcStatus.NOT_FOUND,
        `Version not found: ${req.versionId}`,
      );
    if (!existing)
      throw this.err(
        GrpcStatus.NOT_FOUND,
        `Template not found: ${req.templateId}`,
      );
    if (target.templateId !== existing.id) {
      throw this.err(
        GrpcStatus.INVALID_ARGUMENT,
        'Version does not belong to the specified template',
      );
    }

    const data = await this.prisma.$transaction(async (tx) => {
      await tx.templateVersion.create({
        data: {
          templateId: existing.id,
          version: existing.version,
          slots: existing.slots as JsonInput,
          schema: existing.schema as JsonInput,
          metadata: existing.metadata as JsonInput,
          changedById: req.context?.userId,
          changeNote: req.changeNote ?? `Reverted to version ${target.version}`,
        },
      });

      return tx.template.update({
        where: { id: req.templateId },
        data: {
          slots: target.slots as JsonInput,
          schema: (target.schema ?? null) as JsonInput,
          metadata: (target.metadata ?? null) as JsonInput,
          version: { increment: 1 },
        },
      });
    });

    this.invalidateByKey(existing.key);
    return { data: this.serializeTemplate(data), metadata: JSON.stringify({}) };
  }

  // ── Org overrides ──────────────────────────────────────────────────────────

  /**
   * Creates or updates an org's slot override for a system template.
   *
   * Orgs store only the slots they want to customise — missing slots fall back to
   * the system template at render time. On update, the previous override state is
   * snapshotted and the version counter is incremented inside a transaction.
   *
   * Invalidates the render cache entry for `(templateKey, organizationId)`.
   *
   * @throws `INVALID_ARGUMENT` — missing required fields or invalid JSON.
   */
  async upsertOrgOverride(
    req: UpsertOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    this.require(req.templateKey, 'templateKey');
    this.require(req.organizationId, 'organizationId');
    this.require(req.slots, 'slots');

    const slots = this.parseJson(req.slots, 'slots');
    const metadata = this.parseJson(req.metadata, 'metadata');

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
      data = await this.prisma.$transaction(async (tx) => {
        await tx.orgTemplateOverrideVersion.create({
          data: {
            overrideId: existing.id,
            version: existing.version,
            slots: existing.slots as JsonInput,
            metadata: existing.metadata as JsonInput,
            changedById: req.context?.userId,
            changeNote: req.changeNote,
          },
        });

        return tx.orgTemplateOverride.update({
          where: { id: existing.id },
          data: {
            slots: slots as JsonInput,
            metadata: (metadata !== undefined
              ? metadata
              : existing.metadata) as JsonInput,
            version: { increment: 1 },
          },
        });
      });
    } else {
      data = await this.prisma.orgTemplateOverride.create({
        data: {
          templateKey: req.templateKey,
          organizationId: req.organizationId,
          slots: slots as JsonInput,
          metadata: metadata as JsonInput,
        },
      });
    }

    this.invalidateByOrg(req.templateKey, req.organizationId);
    return { data: this.serializeOverride(data), metadata: JSON.stringify({}) };
  }

  async getOrgOverride(
    req: GetOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    this.require(req.templateKey, 'templateKey');
    this.require(req.organizationId, 'organizationId');
    const data = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: {
          templateKey: req.templateKey,
          organizationId: req.organizationId,
        },
      },
    });
    if (!data) {
      throw this.err(
        GrpcStatus.NOT_FOUND,
        `Override not found for key "${req.templateKey}" org "${req.organizationId}"`,
      );
    }
    return { data: this.serializeOverride(data), metadata: JSON.stringify({}) };
  }

  async deleteOrgOverride(
    req: DeleteOrgOverrideRequest,
  ): Promise<DeleteResponse> {
    this.require(req.templateKey, 'templateKey');
    this.require(req.organizationId, 'organizationId');
    const existing = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: {
          templateKey: req.templateKey,
          organizationId: req.organizationId,
        },
      },
    });
    if (!existing) throw this.err(GrpcStatus.NOT_FOUND, 'Override not found');

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

    this.invalidateByOrg(req.templateKey, req.organizationId);
    return { success: true };
  }

  async listOrgOverrides(req: ListOrgOverridesRequest) {
    this.require(req.organizationId, 'organizationId');
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
    this.require(req.overrideId, 'overrideId');
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

  /**
   * Reverts an org override to the content of a specific past version.
   * Follows the same forward-only, transactional snapshot pattern as {@link revert}.
   *
   * @throws `NOT_FOUND`        — override or version does not exist.
   * @throws `INVALID_ARGUMENT` — version belongs to a different override.
   */
  async revertOrgOverride(
    req: RevertOrgOverrideRequest,
  ): Promise<GetOrgOverrideResponse> {
    this.require(req.overrideId, 'overrideId');
    this.require(req.versionId, 'versionId');

    const [target, existing] = await Promise.all([
      this.prisma.orgTemplateOverrideVersion.findUnique({
        where: { id: req.versionId },
      }),
      this.prisma.orgTemplateOverride.findUnique({
        where: { id: req.overrideId },
      }),
    ]);
    if (!target)
      throw this.err(
        GrpcStatus.NOT_FOUND,
        `Override version not found: ${req.versionId}`,
      );
    if (!existing)
      throw this.err(
        GrpcStatus.NOT_FOUND,
        `Override not found: ${req.overrideId}`,
      );
    if (target.overrideId !== existing.id) {
      throw this.err(
        GrpcStatus.INVALID_ARGUMENT,
        'Version does not belong to the specified override',
      );
    }

    const data = await this.prisma.$transaction(async (tx) => {
      await tx.orgTemplateOverrideVersion.create({
        data: {
          overrideId: existing.id,
          version: existing.version,
          slots: existing.slots as JsonInput,
          metadata: existing.metadata as JsonInput,
          changedById: req.context?.userId,
          changeNote: req.changeNote ?? `Reverted to version ${target.version}`,
        },
      });

      return tx.orgTemplateOverride.update({
        where: { id: req.overrideId },
        data: {
          slots: target.slots as JsonInput,
          metadata: (target.metadata ?? null) as JsonInput,
          version: { increment: 1 },
        },
      });
    });

    this.invalidateByOrg(existing.templateKey, existing.organizationId);
    return { data: this.serializeOverride(data), metadata: JSON.stringify({}) };
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  /**
   * Resolves, merges, and compiles a template for a given set of variables.
   *
   * **Resolution & caching:**
   * The `(template, override)` pair is looked up from the in-memory render cache
   * keyed by `key` or `key:orgId`. On a cache miss, both rows are fetched from the
   * DB in parallel and stored in the cache for {@link RENDER_CACHE_TTL_MS}.
   *
   * **Merge:**
   * ```
   * mergedSlots = { ...systemSlots, ...orgOverrideSlots }  // org wins on conflict
   * ```
   * If no org override exists, the system template's slots are used as-is.
   *
   * **Compilation:**
   * Each merged slot value is a Handlebars template string compiled with the
   * caller-supplied `variables`. Compiled functions are cached in
   * {@link TemplatesRenderer}'s compile cache.
   *
   * @param req.key            - The template's unique dot-notation key.
   * @param req.organizationId - If provided, the org's override is merged in (optional).
   * @param req.variables      - JSON-encoded object passed to Handlebars at compile time.
   * @returns `{ renderedSlots, metadata }` where each slot value is the final compiled string.
   *
   * @throws `NOT_FOUND`        — template key does not exist or is voided.
   * @throws `INVALID_ARGUMENT` — missing `key` or invalid `variables` JSON.
   * @throws `INTERNAL`         — a slot contains a Handlebars syntax error.
   */
  async renderTemplate(req: RenderTemplateRequest) {
    this.require(req.key, 'key');

    const cacheKey = req.organizationId
      ? `${req.key}:${req.organizationId}`
      : req.key;
    const now = Date.now();
    const cached = this.renderCache.get(cacheKey);

    let template: Template;
    let override: OrgTemplateOverride | null;

    if (cached && now - cached.cachedAt < RENDER_CACHE_TTL_MS) {
      template = cached.template;
      override = cached.override;
    } else {
      const [fetchedTemplate, fetchedOverride] = await Promise.all([
        this.prisma.template.findUnique({
          where: { key: req.key, voided: false },
        }),
        req.organizationId
          ? this.prisma.orgTemplateOverride.findUnique({
              where: {
                templateKey_organizationId: {
                  templateKey: req.key,
                  organizationId: req.organizationId,
                },
                voided: false,
              },
            })
          : Promise.resolve(null),
      ]);

      if (!fetchedTemplate) {
        throw this.err(GrpcStatus.NOT_FOUND, `Template not found: ${req.key}`);
      }

      template = fetchedTemplate;
      override = fetchedOverride;
      this.renderCache.set(cacheKey, { template, override, cachedAt: now });
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

  // ── Serialization ──────────────────────────────────────────────────────────

  /**
   * Converts a Prisma `Template` row into the gRPC `Template` message shape.
   * JSON fields (`slots`, `schema`, `metadata`) are re-serialized to strings
   * because the gRPC proto carries them as `string` (JSON-encoded).
   */
  private serializeTemplate(t: Template) {
    return {
      id: t.id,
      key: t.key,
      type: t.type,
      name: t.name,
      description: t.description ?? undefined,
      engine: TemplateEngine.HANDLEBARS,
      slots: JSON.stringify(t.slots),
      schema: t.schema ? JSON.stringify(t.schema) : undefined,
      metadata: t.metadata ? JSON.stringify(t.metadata) : undefined,
      version: t.version,
      voided: t.voided,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  /** Converts a Prisma `OrgTemplateOverride` row into the gRPC message shape. */
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
