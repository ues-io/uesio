import { ViewParams } from "../../view/view"

type WorkspaceState = {
	name: string
	app: string
}

type RouteState = {
	viewname: string
	viewnamespace: string
	params?: ViewParams
	namespace: string
	path: string
	workspace?: WorkspaceState
	theme: string
} | null

export { RouteState, WorkspaceState }
