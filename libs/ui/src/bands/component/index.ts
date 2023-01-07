import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentState } from "./types"
import { set as setRoute } from "../route"

const componentAdapter = createEntityAdapter<ComponentState>({
	selectId: (component) => component.id,
})

const componentSlice = createSlice({
	name: "component",
	initialState: componentAdapter.getInitialState(),
	reducers: {
		set: componentAdapter.upsertOne,
		setMany: componentAdapter.upsertMany,
	},
	extraReducers: (builder) => {
		builder.addCase(setRoute, componentAdapter.removeAll)
	},
})

const selectors = componentAdapter.getSelectors(
	(state: RootState) => state.component
)
export const { set, setMany } = componentSlice.actions
export { selectors }
export default componentSlice.reducer
