type WorkspaceState = {
	name: string
	app: string
}

type RouteState = {
	view: string
	params?: Record<string, string>
	namespace: string
	path: string
	workspace?: WorkspaceState
	theme: string
	isLoading?: boolean
} | null

export { RouteState, WorkspaceState }
