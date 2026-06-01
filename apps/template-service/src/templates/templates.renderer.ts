import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import * as Handlebars from 'handlebars';

/** Evict the oldest compiled template when the cache exceeds this size. */
const MAX_COMPILE_CACHE = 500;

/**
 * Handlebars runtime options applied on every template execution.
 *
 * Blocks traversal of the JavaScript prototype chain during rendering, which
 * prevents prototype pollution attacks where a malicious `variables` payload
 * could access or overwrite Object.prototype properties.
 */
const HBS_RUNTIME_OPTS: Handlebars.RuntimeOptions = {
  allowProtoPropertiesByDefault: false,
  allowProtoMethodsByDefault: false,
};

/**
 * Handles all Handlebars-related operations for the template service.
 *
 * Responsibilities:
 * - Merging system slots with org override slots (org wins on conflict)
 * - Compiling and executing Handlebars templates against caller-supplied variables
 * - Parsing JSON-encoded slots, metadata, and variables received from gRPC
 *
 * **Compile cache:** compiled Handlebars template functions are cached by their
 * source string (max {@link MAX_COMPILE_CACHE} entries, LRU eviction). This avoids
 * re-parsing the Handlebars AST on every `RenderTemplate` call, which is significant
 * for large email HTML bodies.
 */
@Injectable()
export class TemplatesRenderer {
  /**
   * Cache of compiled Handlebars template functions, keyed by the raw template string.
   * Map preserves insertion order, which is used for LRU eviction.
   */
  private readonly compileCache = new Map<
    string,
    Handlebars.TemplateDelegate
  >();

  /**
   * Merges system and org override slots, compiles each with Handlebars, and returns
   * the rendered output alongside the merged metadata.
   *
   * **Merge order (last wins):**
   * ```
   * mergedSlots    = { ...templateSlots,   ...overrideSlots   }
   * mergedMetadata = { ...templateMetadata, ...overrideMetadata }
   * ```
   *
   * Each slot value is a Handlebars template string. The compiled function is cached
   * so that repeated calls for the same slot string skip re-compilation.
   *
   * @param templateSlots   - Slots from the system template (full set).
   * @param overrideSlots   - Slots from the org override (partial, null if no override).
   * @param templateMetadata - Metadata from the system template.
   * @param overrideMetadata - Metadata from the org override (merged on top).
   * @param variables        - Data passed to Handlebars at compile time (e.g. `{ user, actionUrl }`).
   * @returns `{ renderedSlots, metadata }` where each slot value is the compiled output string.
   * @throws `RpcException(INTERNAL)` if a slot contains invalid Handlebars syntax.
   */
  render(
    templateSlots: Record<string, string>,
    overrideSlots: Record<string, string> | null,
    templateMetadata: Record<string, unknown> | null,
    overrideMetadata: Record<string, unknown> | null,
    variables: Record<string, unknown>,
  ): {
    renderedSlots: Record<string, string>;
    metadata: Record<string, unknown>;
  } {
    const mergedSlots = { ...templateSlots, ...(overrideSlots ?? {}) };
    const mergedMetadata = {
      ...(templateMetadata ?? {}),
      ...(overrideMetadata ?? {}),
    };

    const renderedSlots: Record<string, string> = {};
    for (const [name, templateString] of Object.entries(mergedSlots)) {
      try {
        renderedSlots[name] = this.compile(templateString)(
          variables,
          HBS_RUNTIME_OPTS,
        );
      } catch (err) {
        throw new RpcException({
          code: GrpcStatus.INTERNAL,
          message: `Failed to compile slot "${name}": ${(err as Error).message}`,
        });
      }
    }

    return { renderedSlots, metadata: mergedMetadata };
  }

  /**
   * Parses a JSON-encoded slots string (as received from the gRPC `slots` field)
   * into a `Record<string, string>` where each value is a Handlebars template string.
   *
   * @param raw - JSON string, e.g. `'{"email_subject":"Hello {{name}}"}'`.
   * @throws `RpcException(INVALID_ARGUMENT)` if the string is not valid JSON.
   */
  parseSlots(raw: string): Record<string, string> {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: `Invalid slots JSON: ${raw.slice(0, 80)}`,
      });
    }
  }

  /**
   * Parses a JSON-encoded metadata string into a plain object.
   * Returns `null` for empty or absent input (metadata is optional on all models).
   *
   * @param raw - JSON string or null/undefined.
   * @throws `RpcException(INVALID_ARGUMENT)` if the string is present but not valid JSON.
   */
  parseMetadata(
    raw: string | undefined | null,
  ): Record<string, unknown> | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: `Invalid metadata JSON: ${raw.slice(0, 80)}`,
      });
    }
  }

  /**
   * Parses a JSON-encoded variables string supplied by the caller at render time.
   * Returns an empty object for absent/null/empty input — callers may omit variables
   * when the template uses none.
   *
   * @param raw - JSON string, e.g. `'{"user":{"firstName":"Alice"},"actionUrl":"https://..."}'`.
   * @throws `RpcException(INVALID_ARGUMENT)` if the string is present but not valid JSON.
   */
  parseVariables(raw: string | undefined | null): Record<string, unknown> {
    if (!raw || raw.trim() === '' || raw.trim() === 'null') return {};
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: `Invalid variables JSON: ${raw.slice(0, 80)}`,
      });
    }
  }

  /**
   * Returns a compiled Handlebars template function for the given source string,
   * using the in-memory cache to avoid recompilation.
   *
   * When the cache is full, the oldest entry (first inserted) is evicted before
   * the new entry is added (simple LRU — Map iterates in insertion order).
   *
   * @param templateString - Raw Handlebars template source.
   */
  private compile(templateString: string): Handlebars.TemplateDelegate {
    let fn = this.compileCache.get(templateString);
    if (!fn) {
      if (this.compileCache.size >= MAX_COMPILE_CACHE) {
        this.compileCache.delete(this.compileCache.keys().next().value!);
      }
      fn = Handlebars.compile(templateString);
      this.compileCache.set(templateString, fn);
    }
    return fn;
  }
}
