import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { Component } from "../../definition/component"
import { RootState } from "../../store/store"
import { getKey } from "../../metadata/metadata"

const adapter = createEntityAdapter<Component>({
	selectId: getKey,
})

const selectors = adapter.getSelectors(
	(state: RootState) => state.componenttype
)

const metadataSlice = createSlice({
	name: "componenttype",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

const selectId = adapter.selectId

const useComponentType = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))

const useComponentTypes = () => useSelector(selectors.selectAll)

export { useComponentType, useComponentTypes, selectors, selectId, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
