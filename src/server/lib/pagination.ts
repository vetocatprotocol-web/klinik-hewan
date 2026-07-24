export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export function getPaginationParams(params: PaginationParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
    hasPrevious: page > 1,
  };
}

export async function paginate<T>(
  findManyPromise: Promise<T[]>,
  countPromise: Promise<number>,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const { page, limit } = getPaginationParams(params);

  const [data, total] = await Promise.all([
    findManyPromise,
    countPromise,
  ]);

  return createPaginatedResult(data, total, page, limit);
}
