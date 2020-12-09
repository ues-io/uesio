import { createSlice } from "@reduxjs/toolkit"

import viewAdapter from "./adapter"

import loadViewOp from "./operations/load"

const viewSlice = createSlice({
	name: "viewdef",
	initialState: viewAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loadViewOp.fulfilled, viewAdapter.upsertOne)
		builder.addCase(loadViewOp.pending, (state, { meta: { arg } }) => {
			viewAdapter.upsertOne(state, {
				namespace: arg.namespace,
				name: arg.name,
				path: arg.path,
				params: arg.params,
				loaded: false,
			})
		})
	},
})

export default viewSlice.reducer
