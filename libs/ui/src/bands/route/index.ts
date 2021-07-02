import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RouteState } from "./types"

const routeSlice = createSlice({
	name: "route",
	initialState: null as RouteState,
	reducers: {
		set: (state, { payload }: PayloadAction<RouteState>) => payload,
		setLoading: (state) => {
			if (state) state.isLoading = true
		},
		setNotification: (state) => {
			console.log("setting notificationz")
			if (state && state.params) state.params.notification = "hey"
		},
	},
})

export const { set, setLoading, setNotification } = routeSlice.actions
export default routeSlice.reducer
