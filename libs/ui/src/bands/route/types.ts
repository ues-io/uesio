import { ViewParams } from "../view/types"

type WorkspaceState = {
	name: string
	app: string
}

type RouteState = {
	view: string
	params?: ViewParams
	namespace: string
	path: string
	workspace?: WorkspaceState
	theme: string
	isLoading?: boolean
} | null

export { RouteState, WorkspaceState }
