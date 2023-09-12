import { createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit"
import { PlainCollection, PlainCollectionMap } from "./types"
import collectionAdapter from "./adapter"
import { init as initWire, load as loadWire, WireLoadAction } from "../wire"
import { initEntity } from "../utils"

const mergeCollection = (
	state: EntityState<PlainCollection>,
	collections: PlainCollectionMap | undefined
) => {
	if (!collections) return
	const collectionsToAdd: PlainCollectionMap = {}
	for (const [key, collection] of Object.entries(collections)) {
		collectionsToAdd[key] = {
			...collection,
			fields: {
				...state.entities[key]?.fields,
				...collection.fields,
			},
		}
	}

	collectionAdapter.upsertMany(state, collectionsToAdd)
}

type SetCollectionAction = PayloadAction<PlainCollectionMap>

const collectionSlice = createSlice({
	name: "collection",
	initialState: collectionAdapter.getInitialState(),
	reducers: {
		set: (state, { payload }: SetCollectionAction) =>
			mergeCollection(state, payload),
		setMany: collectionAdapter.upsertMany,
		init: initEntity<PlainCollection>,
	},
	extraReducers: (builder) => {
		builder.addCase(
			loadWire,
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

export const { set, setMany, init } = collectionSlice.actions
export default collectionSlice.reducer
