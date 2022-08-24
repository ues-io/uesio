import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { ComponentVariant } from "../../definition/componentvariant"
import { RootState } from "../../store/store"

const adapter = createEntityAdapter<ComponentVariant>({
	selectId: (cv) => `${cv.component}:${cv.namespace}.${cv.name}`,
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

const useComponentVariants = () => useSelector(selectors.selectAll)

export { useComponentVariant, useComponentVariants, selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
