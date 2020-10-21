import { BandAction } from "../store/actions/actions"
import WorkspaceState from "../store/types/workspacestate"
import { ViewParams } from "../view/view"

const SET_ROUTE = "SET_ROUTE"

interface SetRouteAction extends BandAction {
	name: typeof SET_ROUTE
	data: {
		name: string
		namespace: string
		params: ViewParams
		workspace?: WorkspaceState
	}
}

export { SET_ROUTE, SetRouteAction }
