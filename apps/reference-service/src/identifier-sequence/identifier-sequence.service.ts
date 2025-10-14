/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateIdentifierSequenceRequest,
  DeleteRequest,
  QueryIdentifierSequenceRequest,
} from '@hive/reference';
import { Injectable } from '@nestjs/common';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';
import { IdentifierSequence } from '../../generated/prisma';

@Injectable()
export class IdentifierSequenceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  private padNumber(n: number, width: number) {
    return n.toString().padStart(width, '0');
  }

  async getAll(query: QueryIdentifierSequenceRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.identifierSequence.findMany
    > = {
      where: {
        dataModel: query?.dataModel,
        updatedAt: {
          gte: query.updatedAtFrom ? new Date(query?.updatedAtFrom) : undefined, // TODO: explore timezone options
          lte: query.updatedAtTo ? new Date(query?.updatedAtTo) : undefined,
        },
      },
      ...this.paginationService.buildPaginationQuery(query.queryBuilder),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    };
    const [data, totalCount] = await Promise.all([
      this.prismaService.identifierSequence.findMany(dbQuery),
      this.prismaService.identifierSequence.count(pick(dbQuery, 'where')),
    ]);
    return {
      data: data as Array<
        IdentifierSequence & { updatedAt: string; lastNumber: string }
      >,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async create(query: CreateIdentifierSequenceRequest) {
    const { dataModel, prefix, width } = query;
    let sequence = await this.prismaService.identifierSequence.findFirst({
      where: { dataModel },
    });
    if (!sequence) {
      sequence = await this.prismaService.identifierSequence.create({
        data: { dataModel },
      });
    }
    const identifier = `${prefix}-${this.padNumber(sequence.lastNumber + 1, width)}`;

    // Increment after generation
    await this.prismaService.identifierSequence.update({
      where: { dataModel },
      data: { lastNumber: { increment: 1 } },
    });

    return {
      data: {
        identitySequence: sequence as IdentifierSequence & {
          updatedAt: string;
          lastNumber: string;
        },
        identifier,
        prefix,
        width,
      },
      metadata: JSON.stringify({}),
    };
  }

  async delete(query: DeleteRequest) {
    const { id, purge, queryBuilder } = query;
    const data = await this.prismaService.identifierSequence.delete({
      where: { id },
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data: data as IdentifierSequence & {
        updatedAt: string;
        lastNumber: string;
      },
      metadata: JSON.stringify({}),
    };
  }
}
