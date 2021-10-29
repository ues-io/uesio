import { hooks, signal, context, definition } from "@uesio/ui"

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

const usePagination = (id: string, props: definition.BaseProps) => {
	const uesio = hooks.useUesio(props)
	return uesio.component.useState<number>(
		id || props.path || "",
		0,
		PAGINATION_SLICE
	)
}

const paginate = <T extends unknown>(
	items: T[],
	currentPage: number,
	pageSize: number
): T[] => {
	if (!pageSize) return items
	const start = currentPage * pageSize
	const end = start + pageSize
	return items.slice(start, end)
}

export { nextPage, prevPage, paginate, usePagination }
