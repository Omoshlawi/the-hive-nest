import { pick } from 'lodash';
import { CustomRepresentationService } from '../query-builder/representation.service';
import { PaginationService } from '../query-builder/pagination.service';
import { SortService } from '../query-builder/sort.service';
import {
  BaseCrudDeleteRequest,
  BaseCrudGetRequest,
  BaseCrudQueryRequest,
} from './crud-request.interface';
import { CrudDelegate } from './prisma-delegate.interface';

export abstract class BaseCrudService<
  TModel,
  TWhereInput extends Record<string, any> = Record<string, any>,
  TQueryRequest extends BaseCrudQueryRequest = BaseCrudQueryRequest,
> {
  constructor(
    protected readonly paginationService: PaginationService,
    protected readonly sortService: SortService,
    protected readonly representationService: CustomRepresentationService,
  ) {}

  protected abstract getDelegate(): CrudDelegate<TModel, TWhereInput>;

  protected abstract buildFilter(query: TQueryRequest): TWhereInput;

  async getAll(query: TQueryRequest) {
    const where = this.buildFilter(query);
    const dbQuery = {
      where,
      ...this.paginationService.buildPaginationQuery(query.queryBuilder),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    };
    const [data, totalCount] = await Promise.all([
      this.getDelegate().findMany(dbQuery),
      this.getDelegate().count(
        pick(dbQuery, 'where') as { where: TWhereInput },
      ),
    ]);
    return { data, metadata: JSON.stringify({ totalCount }) };
  }

  async getById(query: BaseCrudGetRequest) {
    const data = await this.getDelegate().findUnique({
      where: { id: query.id },
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
    });
    return { data, metadata: JSON.stringify({}) };
  }

  async delete(query: BaseCrudDeleteRequest) {
    const { id, purge, queryBuilder } = query;
    const repQuery = this.representationService.buildCustomRepresentationQuery(
      queryBuilder?.v,
    );
    const data = purge
      ? await this.getDelegate().delete({ where: { id }, ...repQuery })
      : await this.getDelegate().update({
          where: { id },
          data: { voided: true },
          ...repQuery,
        });
    return { data, metadata: JSON.stringify({}) };
  }

  protected async createRecord(data: Record<string, any>, v?: string) {
    const record = await this.getDelegate().create({
      data,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });
    return { data: record, metadata: JSON.stringify({}) };
  }

  protected async updateRecord(
    id: string,
    data: Record<string, any>,
    v?: string,
  ) {
    const record = await this.getDelegate().update({
      where: { id },
      data,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });
    return { data: record, metadata: JSON.stringify({}) };
  }
}
