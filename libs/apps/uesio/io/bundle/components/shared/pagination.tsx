import { hooks, signal, definition } from "@uesio/ui"
import { useEffect } from "react"

const PAGINATION_SLICE = "pagination"

const nextPage: signal.ComponentSignalDescriptor = {
	dispatcher: (signal, context, getState, setState) => {
		const currentPage = (getState() as number) ?? 0
		setState(currentPage + 1)
	},
	label: "Next Page",
	properties: () => [],
	slice: PAGINATION_SLICE,
}

const prevPage: signal.ComponentSignalDescriptor = {
	dispatcher: (signal, context, getState, setState) => {
		const currentPage = (getState() as number) ?? 0
		if (currentPage > 0) setState(currentPage - 1)
	},
	label: "Previous Page",
	properties: () => [],
	slice: PAGINATION_SLICE,
}

const usePagination = (
	id: string,
	batch: string | undefined,
	props: definition.BaseProps
): [number | undefined, (page: number) => void] => {
	const uesio = hooks.useUesio(props)
	const batchId = batch || ""
	const [currentPage, setPagination] = uesio.component.useState<number>(
		id || props.path || "",
		0,
		PAGINATION_SLICE
	)

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
