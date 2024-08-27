import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
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

const useFeatureFlag = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))

const useFeatureFlagKeys = () => useSelector(selectors.selectIds) as string[]

export { useFeatureFlag, useFeatureFlagKeys, selectByName, selectors, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
