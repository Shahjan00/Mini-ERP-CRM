export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export const getPagination = (page?: unknown, pageSize?: unknown): PaginationParams => {
  const parsedPage = Number(page);
  const parsedPageSize = Number(pageSize);
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safePageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0
    ? Math.min(parsedPageSize, 100)
    : 10;

  return {
    page: safePage,
    pageSize: safePageSize,
    skip: (safePage - 1) * safePageSize,
  };
};

export const createPaginationMeta = (total: number, page: number, pageSize: number) => ({
  total,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
