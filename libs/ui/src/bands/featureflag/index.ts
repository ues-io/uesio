import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { FeatureFlagState } from "../../definition/featureflag"
import { RootState } from "../../store/store"
import { getKey } from "../../metadata/metadata"

const adapter = createEntityAdapter({
	selectId: getKey<FeatureFlagState>,
})

const selectors = adapter.getSelectors((state: RootState) => state.featureflag)

const selectByName = (state: RootState, name: string) =>
	selectors.selectAll(state).find((el) => el.name && el.name === name)

const metadataSlice = createSlice({
	name: "featureflag",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

export { selectByName, selectors, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
