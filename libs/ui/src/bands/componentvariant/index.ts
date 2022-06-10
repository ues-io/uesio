import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { RootState } from "../../store/store"
import { MetadataState } from "../metadata/types"

const adapter = createEntityAdapter<MetadataState>({
	selectId: (metadata) => metadata.key,
})

const selectors = adapter.getSelectors(
	(state: RootState) => state.componentvariant
)

const metadataSlice = createSlice({
	name: "componentvariant",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

const useComponentVariant = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))

const useComponentVariantKeys = () =>
	useSelector(selectors.selectIds) as string[]

export { useComponentVariant, useComponentVariantKeys, selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
