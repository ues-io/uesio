import { createSlice } from "@reduxjs/toolkit"

import viewAdapter from "./adapter"

import loadViewOp from "./operations/load"

const viewSlice = createSlice({
	name: "view",
	initialState: viewAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loadViewOp.fulfilled, viewAdapter.upsertOne)
		builder.addCase(loadViewOp.pending, (state, { meta: { arg } }) => {
			const context = arg.context
			const viewDefId = context.getViewDefId()
			if (!viewDefId) {
				return
			}

			viewAdapter.upsertOne(state, {
				viewDefId,
				path: arg.path,
				params: arg.params,
				loaded: false,
			})
		})
	},
})

export default viewSlice.reducer
