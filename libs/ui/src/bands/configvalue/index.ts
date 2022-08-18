import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { ConfigValueState } from "../../definition/configvalue"
import { RootState } from "../../store/store"

const adapter = createEntityAdapter<ConfigValueState>({
	selectId: (cv) => `${cv.namespace}.${cv.name}`,
})

const selectors = adapter.getSelectors((state: RootState) => state.configvalue)

const metadataSlice = createSlice({
	name: "configvalue",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

const useConfigValue = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))

const useConfigValueKeys = () => useSelector(selectors.selectIds) as string[]

export { useConfigValue, useConfigValueKeys, selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
