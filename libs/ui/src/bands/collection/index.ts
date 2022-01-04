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
				const collectionsToAdd: Record<string, PlainCollection> = {}
				for (const [key, collection] of Object.entries(collections)) {
					collectionsToAdd[key] = collection

					if (state.entities[key]) {
						const exitingFields = state.entities[key]?.fields
						const newFields = collection.fields
						collectionsToAdd[key].fields = {
							...exitingFields,
							...newFields,
						}
					}
				}

				collectionAdapter.upsertMany(state, collectionsToAdd)
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
				const collectionsToAdd: Record<string, PlainCollection> = {}
				for (const [key, collection] of Object.entries(collections)) {
					collectionsToAdd[key] = collection

					if (state.entities[key]) {
						const exitingFields = state.entities[key]?.fields
						const newFields = collection.fields
						collectionsToAdd[key].fields = {
							...exitingFields,
							...newFields,
						}
					}
				}

				collectionAdapter.upsertMany(state, collectionsToAdd)
			}
		)
	},
})

export default collectionSlice.reducer
