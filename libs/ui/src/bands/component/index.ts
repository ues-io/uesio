import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentState } from "./types"

const componentAdapter = createEntityAdapter<ComponentState>({
	selectId: (component) =>
		`${component.view}/${component.componentType}/${component.id}`,
})

const componentSlice = createSlice({
	name: "component",
	initialState: componentAdapter.getInitialState(),
	reducers: {
		set: componentAdapter.upsertOne,
	},
})

const selectors = componentAdapter.getSelectors(
	(state: RootState) => state.component
)
export const { set } = componentSlice.actions
export { selectors }
export default componentSlice.reducer
