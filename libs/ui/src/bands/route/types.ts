type TenantState = {
	name: string
	app: string
}

type RouteState = {
	view: string
	params?: Record<string, string>
	namespace: string
	path: string
	workspace?: TenantState
	theme: string
	isLoading?: boolean
} | null

export { RouteState, TenantState }
