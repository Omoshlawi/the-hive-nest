import { RpcException } from '@nestjs/microservices';
import { TemplatesRenderer } from './templates.renderer';

describe('TemplatesRenderer', () => {
  let renderer: TemplatesRenderer;

  beforeEach(() => {
    renderer = new TemplatesRenderer();
  });

  describe('render', () => {
    it('compiles Handlebars slots with provided variables', () => {
      const slots = {
        email_subject: 'Hello {{name}}',
        email_body: '<p>Hi {{name}}</p>',
      };
      const { renderedSlots } = renderer.render(slots, null, null, null, {
        name: 'Alice',
      });
      expect(renderedSlots.email_subject).toBe('Hello Alice');
      expect(renderedSlots.email_body).toBe('<p>Hi Alice</p>');
    });

    it('merges org override slots on top of system slots', () => {
      const systemSlots = {
        email_subject: 'System subject',
        email_body: 'System body',
      };
      const overrideSlots = { email_subject: 'Org subject' }; // org only overrides subject
      const { renderedSlots } = renderer.render(
        systemSlots,
        overrideSlots,
        null,
        null,
        {},
      );
      expect(renderedSlots.email_subject).toBe('Org subject');
      expect(renderedSlots.email_body).toBe('System body'); // falls back to system
    });

    it('merges metadata with org override winning on conflict', () => {
      const systemMeta = { channels: { email: true }, fromName: 'The Hive' };
      const overrideMeta = { fromName: 'Acme Corp' };
      const { metadata } = renderer.render(
        {},
        null,
        systemMeta,
        overrideMeta,
        {},
      );
      expect(metadata).toEqual({
        channels: { email: true },
        fromName: 'Acme Corp',
      });
    });

    it('throws RpcException when a slot has invalid Handlebars', () => {
      const slots = { email_subject: '{{#if}}unclosed' };
      expect(() => renderer.render(slots, null, null, null, {})).toThrow(
        RpcException,
      );
    });

    it('handles empty variables object', () => {
      const slots = { sms_body: 'Your code is {{code}}' };
      const { renderedSlots } = renderer.render(slots, null, null, null, {
        code: '123456',
      });
      expect(renderedSlots.sms_body).toBe('Your code is 123456');
    });
  });

  describe('parseSlots', () => {
    it('parses valid JSON string into slot record', () => {
      const result = renderer.parseSlots('{"email_subject":"Hello"}');
      expect(result).toEqual({ email_subject: 'Hello' });
    });

    it('throws RpcException on invalid JSON', () => {
      expect(() => renderer.parseSlots('not-json')).toThrow(RpcException);
    });
  });

  describe('parseMetadata', () => {
    it('returns null for null input', () => {
      expect(renderer.parseMetadata(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(renderer.parseMetadata(undefined)).toBeNull();
    });

    it('parses valid JSON string', () => {
      const result = renderer.parseMetadata('{"channels":{"email":true}}');
      expect(result).toEqual({ channels: { email: true } });
    });

    it('throws RpcException on invalid JSON', () => {
      expect(() => renderer.parseMetadata('not-json')).toThrow(RpcException);
    });
  });

  describe('parseVariables', () => {
    it('parses valid JSON variables', () => {
      const result = renderer.parseVariables('{"user":{"firstName":"Bob"}}');
      expect(result).toEqual({ user: { firstName: 'Bob' } });
    });

    it('throws RpcException on invalid JSON', () => {
      expect(() => renderer.parseVariables('not-json')).toThrow(RpcException);
    });
  });
});
