import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ViewParams } from "../../view/view"
import { RouteState, WorkspaceState } from "./types"

type RoutePayload = {
	name: string
	namespace: string
	params: ViewParams
	workspace?: WorkspaceState
}

const routeSlice = createSlice({
	name: "route",
	initialState: null as RouteState,
	reducers: {
		set: (state, { payload }: PayloadAction<RoutePayload>) => ({
			...state,
			viewname: payload.name,
			viewnamespace: payload.namespace,
			params: payload.params,
			workspace: payload.workspace,
			namespace: "",
			path: "",
		}),
	},
})

export const { set } = routeSlice.actions
export default routeSlice.reducer
