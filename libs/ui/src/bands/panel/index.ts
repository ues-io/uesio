import { createSlice } from "@reduxjs/toolkit"
import panelAdapter from "./adapter"
import { set as setRoute } from "../route"

const panelSlice = createSlice({
	name: "panel",
	initialState: panelAdapter.getInitialState(),
	reducers: {
		set: panelAdapter.upsertOne,
	},
	extraReducers: (builder) => {
		builder.addCase(setRoute, panelAdapter.removeAll)
	},
})

export const { set } = panelSlice.actions
export default panelSlice.reducer
