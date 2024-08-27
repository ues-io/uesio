import {
	createEntityAdapter,
	createSlice,
	EntityState,
	PayloadAction,
} from "@reduxjs/toolkit"
import { PlainCollection, PlainCollectionMap } from "./types"
import { init as initWire, load as loadWire, WireLoadAction } from "../wire"
import { getKey } from "../../metadata/metadata"
import { RootState } from "../../store/store"

const adapter = createEntityAdapter({
	selectId: getKey<PlainCollection>,
})

const selectors = adapter.getSelectors((state: RootState) => state.collection)

const mergeCollection = (
	state: EntityState<PlainCollection, string>,
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
			hasAllFields:
				state.entities[key]?.hasAllFields || collection.hasAllFields,
		}
	}

	adapter.upsertMany(state, collectionsToAdd)
}

type SetCollectionAction = PayloadAction<PlainCollectionMap>

const collectionSlice = createSlice({
	name: "collection",
	initialState: adapter.getInitialState(),
	reducers: {
		set: (state, { payload }: SetCollectionAction) =>
			mergeCollection(state, payload),
		setMany: adapter.upsertMany,
		init: adapter.setAll,
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

export { adapter, selectors }
export const { set, setMany, init } = collectionSlice.actions
export default collectionSlice.reducer
