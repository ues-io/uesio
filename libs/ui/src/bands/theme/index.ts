import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { ThemeState } from "../../definition/theme"
import { RootState } from "../../store/store"

const adapter = createEntityAdapter<ThemeState>({
	selectId: (theme) => `${theme.namespace}.${theme.name}`,
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

export { selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
