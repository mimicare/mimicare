import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator, SetMetadata } from '@nestjs/common';

export const PAGINATE_METADATA_KEY = 'paginate:options';

export interface PaginateOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export const Paginate = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PaginateOptions => {
    const request = ctx.switchToHttp().getRequest();
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      sortBy: request.query.sortBy,
      order: request.query.order,
      search: request.query.search,
      filters: request.query.filters ? JSON.parse(request.query.filters) : undefined,
    };
  },
);

// Decorator to mark routes that should use pagination
export const UsePagination = (options?: Partial<PaginateOptions>) =>
  SetMetadata(PAGINATE_METADATA_KEY, options || {});
