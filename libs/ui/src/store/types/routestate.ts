import { ViewParams } from "../../view/view"
import WorkspaceState from "./workspacestate"

type RouteState = {
	viewname: string
	viewnamespace: string
	params?: ViewParams
	namespace: string
	path: string
	workspace?: WorkspaceState
}

export default RouteState
