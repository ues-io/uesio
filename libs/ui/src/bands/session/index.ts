import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { SessionState } from "./types"

const sessionSlice = createSlice({
	name: "session",
	initialState: null as SessionState,
	reducers: {
		set: (state, { payload }: PayloadAction<SessionState>) => payload,
	},
})

export const { set } = sessionSlice.actions
export default sessionSlice.reducer
