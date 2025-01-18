import { api, signal } from "@uesio/ui"
import { useEffect } from "react"

type PaginationState = {
  pagination?: number
}

const nextPage: signal.ComponentSignalDescriptor<PaginationState> = {
  dispatcher: (state) => {
    const currentPage = state.pagination ?? 0
    state.pagination = currentPage + 1
  },
}

const prevPage: signal.ComponentSignalDescriptor<PaginationState> = {
  dispatcher: (state) => {
    const currentPage = state.pagination ?? 0
    state.pagination = currentPage - 1
  },
}

const usePagination = (
  id: string,
  batch: string | undefined,
): [number | undefined, (page: number) => void] => {
  const batchId = batch || ""
  const [currentPage, setPagination] = api.component.useStateSlice<
    number | undefined
  >("pagination", id, 0)

  useEffect(() => {
    if (currentPage !== 0) {
      setPagination(0)
    }
    // We do NOT want to reset the pagination whenever currentPage changes,
    // so we don't want to add currentPage or setPagination to the deps array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId])

  return [currentPage, setPagination]
}

const paginate = <T,>(
  items: T[],
  currentPage: number,
  pageSize: number,
): T[] => {
  if (!pageSize) return items
  const maxPages = pageSize ? Math.ceil(items.length / pageSize) : 1
  const page = currentPage >= maxPages ? maxPages - 1 : currentPage
  const start = page * pageSize
  const end = start + pageSize
  return items.slice(start, end)
}

export { nextPage, prevPage, paginate, usePagination }
