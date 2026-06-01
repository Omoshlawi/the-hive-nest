import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { TemplatesService } from './templates.service';
import { TemplatesRenderer } from './templates.renderer';
import { PrismaService } from '../prisma/prisma.service';

const slotsJson = JSON.stringify({
  email_subject: 'Hello {{name}}',
  email_body: '<p>Hi {{name}}</p>',
});

const mockTemplate = {
  id: 'tpl-1',
  key: 'auth.email.verification',
  type: 'notification',
  name: 'Email Verification',
  description: null,
  engine: 'HANDLEBARS' as const,
  slots: { email_subject: 'Hello {{name}}', email_body: '<p>Hi {{name}}</p>' },
  schema: null,
  metadata: null,
  version: 1,
  voided: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockPrisma = {
  template: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  templateVersion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  orgTemplateOverride: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  orgTemplateOverrideVersion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        TemplatesRenderer,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a template and returns serialized data', async () => {
      mockPrisma.template.create.mockResolvedValue(mockTemplate);
      const result = await service.create({
        queryBuilder: undefined,
        key: 'auth.email.verification',
        type: 'notification',
        name: 'Email Verification',
        slots: slotsJson,
      });
      expect(mockPrisma.template.create).toHaveBeenCalledTimes(1);
      expect(result.data?.key).toBe('auth.email.verification');
    });
  });

  describe('update', () => {
    it('snapshots the current version before applying changes', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.templateVersion.create.mockResolvedValue({});
      mockPrisma.template.update.mockResolvedValue({
        ...mockTemplate,
        version: 2,
      });

      await service.update({
        queryBuilder: undefined,
        id: 'tpl-1',
        name: 'Updated Name',
        context: { userId: 'user-1' },
      });

      expect(mockPrisma.templateVersion.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.templateVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 1, changedById: 'user-1' }),
        }),
      );
      expect(mockPrisma.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: { increment: 1 } }),
        }),
      );
    });

    it('throws RpcException when template is not found', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);
      await expect(
        service.update({ queryBuilder: undefined, id: 'missing' }),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('revert', () => {
    it('snapshots current state and applies the target version', async () => {
      const targetVersion = {
        id: 'v-1',
        templateId: 'tpl-1',
        version: 1,
        slots: { email_subject: 'Old subject' },
        schema: null,
        metadata: null,
      };
      mockPrisma.templateVersion.findUnique.mockResolvedValue(targetVersion);
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.templateVersion.create.mockResolvedValue({});
      mockPrisma.template.update.mockResolvedValue({
        ...mockTemplate,
        version: 3,
      });

      await service.revert({
        queryBuilder: undefined,
        templateId: 'tpl-1',
        versionId: 'v-1',
        changeNote: 'Reverting to v1',
      });

      // Current state snapshotted first
      expect(mockPrisma.templateVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ changeNote: 'Reverting to v1' }),
        }),
      );
      // Target version's slots applied
      expect(mockPrisma.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: { increment: 1 } }),
        }),
      );
    });
  });

  describe('renderTemplate', () => {
    it('renders system slots when no org override exists', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.orgTemplateOverride.findUnique.mockResolvedValue(null);

      const result = await service.renderTemplate({
        key: 'auth.email.verification',
        variables: JSON.stringify({ name: 'Alice' }),
      });

      expect(result.renderedSlots.email_subject).toBe('Hello Alice');
      expect(result.renderedSlots.email_body).toBe('<p>Hi Alice</p>');
    });

    it('merges org override slots when override exists', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.orgTemplateOverride.findUnique.mockResolvedValue({
        id: 'ov-1',
        templateKey: 'auth.email.verification',
        organizationId: 'org-1',
        slots: { email_subject: 'Org custom subject {{name}}' },
        metadata: null,
        version: 1,
        voided: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.renderTemplate({
        key: 'auth.email.verification',
        organizationId: 'org-1',
        variables: JSON.stringify({ name: 'Bob' }),
      });

      // Org subject wins
      expect(result.renderedSlots.email_subject).toBe('Org custom subject Bob');
      // System body used (org didn't override it)
      expect(result.renderedSlots.email_body).toBe('<p>Hi Bob</p>');
    });

    it('throws RpcException when template key not found', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(null);
      await expect(
        service.renderTemplate({ key: 'missing.key', variables: '{}' }),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('delete', () => {
    it('soft-deletes by setting voided=true when purge is false', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.template.update.mockResolvedValue({
        ...mockTemplate,
        voided: true,
      });

      await service.delete({
        queryBuilder: undefined,
        id: 'tpl-1',
        purge: false,
      });

      expect(mockPrisma.template.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { voided: true } }),
      );
      expect(mockPrisma.template.delete).not.toHaveBeenCalled();
    });

    it('hard-deletes when purge is true', async () => {
      mockPrisma.template.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.template.delete.mockResolvedValue(mockTemplate);

      await service.delete({
        queryBuilder: undefined,
        id: 'tpl-1',
        purge: true,
      });

      expect(mockPrisma.template.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.template.update).not.toHaveBeenCalled();
    });
  });
});
