import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ViewParams } from "../view/types"
import { RouteState, WorkspaceState } from "./types"

type RoutePayload = {
	view: string
	params: ViewParams
	workspace?: WorkspaceState
}

const routeSlice = createSlice({
	name: "route",
	initialState: null as RouteState,
	reducers: {
		set: (state, { payload }: PayloadAction<RoutePayload>) => ({
			...state,
			view: payload.view,
			params: payload.params,
			workspace: payload.workspace,
			namespace: "",
			path: "",
			theme: "",
		}),
	},
})

export const { set } = routeSlice.actions
export default routeSlice.reducer
