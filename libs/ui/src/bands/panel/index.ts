import { createSlice } from "@reduxjs/toolkit"
import panelAdapter from "./adapter"

const panelSlice = createSlice({
	name: "panel",
	initialState: panelAdapter.getInitialState(),
	reducers: {
		set: panelAdapter.upsertOne,
	},
})

export const { set } = panelSlice.actions
export default panelSlice.reducer
