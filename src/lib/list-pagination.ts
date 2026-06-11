/** Chave estável para resetar paginação quando filtros da URL mudam. */
export function listSearchFingerprint(search: Record<string, unknown>): string {
  return JSON.stringify(search);
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function listTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function pageForItemIndex(itemIndex: number, pageSize: number): number {
  if (itemIndex < 0) return 1;
  return Math.floor(itemIndex / pageSize) + 1;
}
