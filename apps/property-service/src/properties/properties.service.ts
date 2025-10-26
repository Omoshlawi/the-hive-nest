/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreatePropertyRequest,
  DeletePropertyRequest,
  GetPropertyRequest,
  QueryPropertyRequest,
  UpdatePropertyRequest,
} from '@hive/property';
import { Injectable, Logger } from '@nestjs/common';
import { Property, Prisma, PropertyMediaType } from '../../generated/prisma';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';
import {
  Address,
  GetAddressResponse,
  HiveReferencesServiceClient,
} from '@hive/reference';
import { lastValueFrom } from 'rxjs';
import { ZodValidationException } from 'nestjs-zod';

@Injectable()
export class PropertiesService {
  private logger: Logger = new Logger(PropertiesService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
    private readonly referencesService: HiveReferencesServiceClient,
  ) {}

  private async queryaddress(address: string) {
    try {
      const addresses = await lastValueFrom(
        this.referencesService.address.queryAddress({
          location: address,
          queryBuilder: { v: 'custom:select(id)' },
          context: {},
        }),
      );
      return (addresses.data ?? []).map((addr) => addr.id);
    } catch (error) {
      this.logger.error('Error querying address', error);
      return [];
    }
  }

  async getAll(query: QueryPropertyRequest) {
    const addressIds: string[] = [];
    if (query.address) {
      const ids = await this.queryaddress(query.address);
      addressIds.push(...ids);
    }
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.property.findMany
    > = {
      where: {
        AND: [
          {
            voided: query?.includeVoided ? undefined : false,
            status: query?.status as Prisma.EnumPropertyStatusFilter,
            organizationId: query?.context?.organizationId ?? undefined,
            isVirtual: query?.isVirtual,
            addressId: addressIds.length
              ? {
                  in: addressIds,
                }
              : undefined,
            attributes: Object.keys(query.attributes ?? {}).length
              ? {
                  some: {
                    AND: Object.entries(query.attributes ?? {}).map((attr) => ({
                      OR: [
                        { attribute: { name: attr[0] } },
                        { attributeId: attr[0] },
                      ],
                      value: attr[1],
                    })),
                  },
                }
              : undefined,
          },
          // Amenities
          {
            OR: query?.amenities?.length
              ? [
                  {
                    amenities: { some: { amenityId: { in: query.amenities } } },
                  },
                  {
                    amenities: {
                      some: { amenity: { name: { in: query.amenities } } },
                    },
                  },
                ]
              : undefined,
          },
          // categories
          {
            OR: query?.categories?.length
              ? [
                  {
                    categories: {
                      some: { categoryId: { in: query.categories } },
                    },
                  },
                  {
                    categories: {
                      some: { category: { name: { in: query.categories } } },
                    },
                  },
                ]
              : undefined,
          },
          // seach
          {
            OR: query.search
              ? [{ name: { contains: query.search, mode: 'insensitive' } }]
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
    this.logger.log('Query: ' + JSON.stringify(dbQuery, null, 2));
    const [data, totalCount] = await Promise.all([
      this.prismaService.property.findMany(dbQuery),
      this.prismaService.property.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetPropertyRequest) {
    const data = await this.prismaService.property.findUnique({
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

  private async validateAddress(
    addressId: string,
  ): Promise<GetAddressResponse['data']> {
    try {
      const address = await lastValueFrom(
        this.referencesService.address.getAddress({
          id: addressId,
          queryBuilder: {},
          context: {},
        }),
      );
      return address.data;
    } catch (error: any) {
      throw new ZodValidationException({
        issues: [
          {
            code: 'custom',
            message: 'Invalid address provided',
            path: ['addressId'],
          },
        ],
      });
    }
  }

  async create(query: CreatePropertyRequest) {
    const {
      queryBuilder,
      context,
      amenityIds,
      categoryIds,
      attributes,
      addressId,
      media: propertyMedia = [],
      ...props
    } = query;
    const address = await this.validateAddress(query.addressId);
    // Generate identifier
    const { data: identifier } = await lastValueFrom(
      this.referencesService.identifierSequence.createIdentifierSequence({
        dataModel: 'Property',
        prefix: 'PRT',
        width: 6,
        queryBuilder: undefined,
      }),
    );
    this.logger.log('Genrated Identifier: ' + identifier?.identifier);

    const data = await this.prismaService.property.create({
      data: {
        ...props,
        propertyNumber: identifier?.identifier as string,
        organizationId: context!.organizationId!,
        createdBy: context!.userId!,
        amenities: {
          createMany: {
            skipDuplicates: true,
            data: (amenityIds ?? []).map((amenityId) => ({ amenityId })),
          },
        },
        attributes: {
          createMany: { skipDuplicates: true, data: attributes ?? [] },
        },

        categories: {
          createMany: {
            skipDuplicates: true,
            data: (categoryIds ?? []).map((categoryId) => ({ categoryId })),
          },
        },
        addressId,
        address: address as Record<string, any>,
        media: {
          createMany: {
            skipDuplicates: true,
            data: propertyMedia?.map((media) => ({
              ...media,
              type: media.type as PropertyMediaType,
              metadata: media.metadata ? JSON.parse(media.metadata) : undefined,
            })),
          },
        },
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

  async update(query: UpdatePropertyRequest) {
    if (query.addressId) await this.validateAddress(query.addressId);
    const { queryBuilder, id, context, ...props } = query;
    const data = await this.prismaService.property.update({
      where: { id },
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async delete(query: DeletePropertyRequest) {
    const { id, purge, queryBuilder } = query;
    let data: Property;
    if (purge) {
      data = await this.prismaService.property.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.property.update({
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
