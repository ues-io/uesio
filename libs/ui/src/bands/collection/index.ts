import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { PlainCollection, PlainCollectionMap, CollectionState } from "./types"
import wireLoadOp from "../wire/operations/load"
import get from "./operations/get"
import { PlainWire } from "../wire/types"
import { wire } from "@uesio/ui"

const initialState: PlainCollectionMap = {}

const collectionSlice = createSlice({
	name: "collection",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			get.collectionMetadata.fulfilled,
			(
				state,
				{
					payload: { collections },
				}: PayloadAction<wire.LoadResponseBatch>
			) => ({
				...state,
				...collections,
			})
		)

		builder.addCase(
			wireLoadOp.fulfilled,
			(
				state,
				{
					payload: [, collections],
				}: PayloadAction<[PlainWire[], Record<string, PlainCollection>]>
			) => ({
				...state,
				...collections,
			})
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
