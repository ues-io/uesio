import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ViewParams } from "../../view/view"
import { RouteState, WorkspaceState } from "./types"

const initialState: RouteState = {
	viewname: "",
	viewnamespace: "",
	namespace: "",
	path: "",
}

type RoutePayload = {
	name: string
	namespace: string
	params: ViewParams
	workspace?: WorkspaceState
}

const routeSlice = createSlice({
	name: "route",
	initialState,
	reducers: {
		set: (state, { payload }: PayloadAction<RoutePayload>) => ({
			...state,
			viewname: payload.name,
			viewnamespace: payload.namespace,
			params: payload.params,
			workspace: payload.workspace,
		}),
	},
})

export const { set } = routeSlice.actions
export default routeSlice.reducer
