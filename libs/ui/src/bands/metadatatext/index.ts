import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { MetadataState } from "../metadata/types"

const adapter = createEntityAdapter<MetadataState>({
	selectId: (metadatatext) =>
		`${metadatatext.metadatatype}:${metadatatext.key}`,
})

const selectors = adapter.getSelectors((state: RootState) => state.metadatatext)

const metadataSlice = createSlice({
	name: "metadatatext",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

export { selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
