import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { MetadataInfo } from "../../platform/platform"
import { RouteState } from "./types"

const routeSlice = createSlice({
	name: "route",
	initialState: null as RouteState,
	reducers: {
		set: (state, { payload }: PayloadAction<RouteState>) => payload,
		setLoading: (state) => {
			if (state) state.isLoading = true
		},
		setNamespaceInfo: (
			state,
			{ payload }: PayloadAction<Record<string, MetadataInfo>>
		) => {
			if (state?.workspace) {
				state.workspace.namespaces = payload
			}
		},
	},
})

export const { set, setLoading, setNamespaceInfo } = routeSlice.actions
export default routeSlice.reducer
