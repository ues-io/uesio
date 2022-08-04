import { hooks, signal, definition } from "@uesio/ui"
import { useEffect } from "react"

const PAGINATION_SLICE = "pagination"
type State = { pagination: number }
const nextPage: signal.ComponentSignalDescriptor<State> = {
	dispatcher: ({ state, setState }) => {
		const currentPage = state[PAGINATION_SLICE] ?? 0
		setState({ ...state, [PAGINATION_SLICE]: currentPage + 1 })
	},
	label: "Next Page",
	properties: () => [],
}

const prevPage: signal.ComponentSignalDescriptor<State> = {
	dispatcher: ({ state, setState }) => {
		const currentPage = state[PAGINATION_SLICE] ?? 0
		if (currentPage > 0)
			setState({ ...state, [PAGINATION_SLICE]: currentPage - 1 })
	},
	label: "Previous Page",
	properties: () => [],
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
		undefined,
		PAGINATION_SLICE
	)
	useEffect(() => {
		setPagination(0)
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
