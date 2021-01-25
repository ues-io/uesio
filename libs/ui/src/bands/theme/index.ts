import { createSlice } from "@reduxjs/toolkit"
import themeAdapter from "./adapter"
import ops from "./operations"

const themeSlice = createSlice({
	name: "theme",
	initialState: themeAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(ops.fetchTheme.fulfilled, themeAdapter.upsertOne)
	},
})

export default themeSlice.reducer
