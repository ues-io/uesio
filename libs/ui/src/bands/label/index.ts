import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { MetadataState } from "../metadata/types"

const adapter = createEntityAdapter<MetadataState>({
	selectId: (metadata) => metadata.key,
})

const selectors = adapter.getSelectors((state: RootState) => state.label)

const metadataSlice = createSlice({
	name: "label",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

const useLabel = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))

const useLabelKeys = () => useSelector(selectors.selectIds) as string[]

export { useLabel, useLabelKeys, selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
