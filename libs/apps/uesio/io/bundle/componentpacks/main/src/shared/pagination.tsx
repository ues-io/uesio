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
	label: "Next Page",
	properties: () => [],
}

const prevPage: signal.ComponentSignalDescriptor<PaginationState> = {
	dispatcher: (state) => {
		const currentPage = state.pagination ?? 0
		state.pagination = currentPage - 1
	},
	label: "Previous Page",
	properties: () => [],
}

const usePagination = (
	id: string,
	batch: string | undefined
): [number | undefined, (page: number) => void] => {
	const batchId = batch || ""
	const [currentPage, setPagination] = api.component.useStateSlice<
		number | undefined
	>("pagination", id, 0)

	useEffect(() => {
		if (currentPage !== 0) {
			setPagination(0)
		}
	}, [batchId])

	return [currentPage, setPagination]
}

const paginate = <T,>(
	items: T[],
	currentPage: number,
	pageSize: number
): T[] => {
	if (!pageSize) return items
	const maxPages = pageSize ? Math.ceil(items.length / pageSize) : 1
	const page = currentPage >= maxPages ? maxPages - 1 : currentPage
	const start = page * pageSize
	const end = start + pageSize
	return items.slice(start, end)
}

export { nextPage, prevPage, paginate, usePagination }
