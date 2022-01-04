import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { PlainCollection } from "./types"
import wireLoadOp from "../wire/operations/load"
import get from "./operations/get"
import { PlainWire } from "../wire/types"
import { wire } from "@uesio/ui"
import collectionAdapter from "./adapter"

const collectionSlice = createSlice({
	name: "collection",
	initialState: collectionAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			get.collectionMetadata.fulfilled,
			(
				state,
				{
					payload: { collections },
				}: PayloadAction<wire.LoadResponseBatch>
			) => {
				console.log("Metadata")
				console.log({ state, collections })
				collectionAdapter.upsertMany(state, collections)
			}
		)

		builder.addCase(
			wireLoadOp.fulfilled,
			(
				state,
				{
					payload: [, collections],
				}: PayloadAction<[PlainWire[], Record<string, PlainCollection>]>
			) => {
				console.log("Wire")
				console.log({ state, collections })
				collectionAdapter.upsertMany(state, collections)
			}
		)

		// builder.addCase(
		// 	wireLoadOp.fulfilled,
		// 	(state, { payload: [, collections], meta }) => {
		// 		for (const [key, value] of Object.entries(collections)) {
		// 			state[key] = {
		// 				status: "FULFILLED",
		// 				data: value,
		// 			}
		// 		}
		// 	}
		// )

		// builder.addCase(
		// 	get.collectionMetadata.fulfilled,
		// 	(state, { payload, meta }) => {
		// 		for (const [key, value] of Object.entries(
		// 			payload.collections
		// 		)) {
		// 			state[key] = {
		// 				status: "FULFILLED",
		// 				data: value,
		// 			}
		// 		}
		// 	}
		// )
	},
})

export default collectionSlice.reducer
