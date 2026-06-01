import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplatesRenderer {
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
        renderedSlots[name] = Handlebars.compile(templateString)(variables);
      } catch (err) {
        throw new RpcException(
          `Failed to compile slot "${name}": ${(err as Error).message}`,
        );
      }
    }

    return { renderedSlots, metadata: mergedMetadata };
  }

  parseSlots(raw: string): Record<string, string> {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      throw new RpcException(`Invalid slots JSON: ${raw}`);
    }
  }

  parseMetadata(
    raw: string | undefined | null,
  ): Record<string, unknown> | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new RpcException(`Invalid metadata JSON: ${raw}`);
    }
  }

  parseVariables(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new RpcException(`Invalid variables JSON: ${raw}`);
    }
  }
}
