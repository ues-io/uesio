import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { FeatureFlagState } from "../../definition/featureflag"
import { RootState } from "../../store/store"

const adapter = createEntityAdapter<FeatureFlagState>({
	selectId: (cv) => `${cv.namespace}.${cv.name}`,
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

export { useFeatureFlag, useFeatureFlagKeys, selectByName, selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
