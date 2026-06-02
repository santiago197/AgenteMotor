import { useCallback, useState } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
}

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({ page: initialPage, pageSize: initialPageSize });
  }, [initialPage, initialPageSize]);

  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    setPage,
    setPageSize,
    resetPagination,
    offset: (pagination.page - 1) * pagination.pageSize,
  };
}
