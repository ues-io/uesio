import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RouteState } from "./types"

const routeSlice = createSlice({
	name: "route",
	initialState: null as RouteState,
	reducers: {
		set: (state, { payload }: PayloadAction<RouteState>) => payload,
	},
})

export const { set } = routeSlice.actions
export default routeSlice.reducer
