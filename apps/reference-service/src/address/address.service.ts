/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateAddressRequest,
  DeleteRequest,
  GetRequest,
  QueryAddressRequest,
  UpdateAddressRequest,
} from '@hive/reference';
import { Injectable } from '@nestjs/common';
import { Address, AddressType } from '../../generated/prisma';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryAddressRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.address.findMany
    > = {
      where: {
        AND: [
          {
            voided: query?.includeVoided ? undefined : false,
            userId: query?.userId,
            organizationId: query?.organizationId,
            type: query?.type as AddressType,
            level1: query?.level1,
            level2: query?.level2,
            level3: query?.level3,
            level4: query?.level4,
            level5: query?.level5,
            country: query?.country,
            postalCode: query?.postalCode,
            startDate: {
              gte: query?.startDateFrom,
              lte: query?.startDateTo,
            },
            endDate: {
              gte: query?.endDateFrom,
              lte: query?.endDateTo,
            },
            createdAt: {
              gte: query?.createdAtFrom,
              lte: query?.createdAtTo,
            },
          },
          {
            OR: query.search
              ? [{ label: { contains: query.search, mode: 'insensitive' } }]
              : undefined,
          },
        ],
      },
      ...this.paginationService.buildPaginationQuery(query.queryBuilder),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    };
    const [data, totalCount] = await Promise.all([
      this.prismaService.address.findMany(dbQuery),
      this.prismaService.address.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetRequest) {
    const data = await this.prismaService.address.findUnique({
      where: {
        id: query.id,
      },
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
    });
    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async create(query: CreateAddressRequest) {
    const { queryBuilder, context, isOrganizationAddress, type, ...props } =
      query;
    const data = await this.prismaService.address.create({
      data: {
        ...props,
        organizationId: isOrganizationAddress
          ? context!.organizationId!
          : undefined,
        userId: isOrganizationAddress ? undefined : context!.userId!,
        type: type as AddressType,
      },
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async update(query: UpdateAddressRequest) {
    const { queryBuilder, id, context: _, type, ...props } = query;
    const data = await this.prismaService.address.update({
      where: { id },
      data: { ...props, type: type as AddressType },
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async delete(query: DeleteRequest) {
    const { id, purge, queryBuilder } = query;
    let data: Address;
    if (purge) {
      data = await this.prismaService.address.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.address.update({
        where: { id },
        data: { voided: true },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    }
    return {
      data,
      metadata: JSON.stringify({}),
    };
  }
}
