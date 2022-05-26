import { createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit"
import { PlainCollection, PlainCollectionMap } from "./types"
import wireLoadOp from "../wire/operations/load"
import collectionAdapter from "./adapter"
import { init as initWire, WireLoadAction } from "../wire"

const mergeCollection = (
	state: EntityState<PlainCollection>,
	collections: PlainCollectionMap
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

type SetCollectionAction = PayloadAction<Record<string, PlainCollection>>

const collectionSlice = createSlice({
	name: "collection",
	initialState: collectionAdapter.getInitialState(),
	reducers: {
		set: (state, { payload }: SetCollectionAction) =>
			mergeCollection(state, payload),
	},
	extraReducers: (builder) => {
		builder.addCase(
			wireLoadOp.fulfilled,
			(state, { payload: [, collections] }: WireLoadAction) => {
				mergeCollection(state, collections)
			}
		)
		builder.addCase(
			initWire,
			(state, { payload: [, collections] }: WireLoadAction) => {
				mergeCollection(state, collections)
			}
		)
	},
})

export const { set } = collectionSlice.actions
export default collectionSlice.reducer
