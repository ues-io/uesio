import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { FileState } from "../../definition/file"
import { RootState } from "../../store/store"
import { getKey } from "../../metadataexports"

const adapter = createEntityAdapter({
	selectId: getKey<FileState>,
})

const selectors = adapter.getSelectors((state: RootState) => state.file)

const metadataSlice = createSlice({
	name: "file",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

const useFile = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))

const useFileKeys = () => useSelector(selectors.selectIds) as string[]

export { useFile, useFileKeys, selectors, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
