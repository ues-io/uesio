import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RouteState } from "./types"

const routeSlice = createSlice({
	name: "route",
	initialState: {} as RouteState,
	reducers: {
		set: (state, { payload }: PayloadAction<RouteState>) => payload,
		setLoading: (state) => {
			if (state) state.isLoading = true
		},
	},
})

export const { set, setLoading } = routeSlice.actions
export default routeSlice.reducer
