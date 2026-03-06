import { useState, useCallback } from "react";

const usePagination = (initialLimit = 10) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);

  const goToPage = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return { page, limit, goToPage, reset };
};

export default usePagination;
