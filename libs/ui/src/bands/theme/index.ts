import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { ThemeState } from "../../definition/theme"
import { RootState } from "../../store/store"
import { getKey } from "../../metadata/metadata"

const adapter = createEntityAdapter<ThemeState>({
	selectId: getKey,
})

const selectors = adapter.getSelectors((state: RootState) => state.theme)

const metadataSlice = createSlice({
	name: "theme",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

export { selectors, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
