import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentState } from "./types"

const getComponentStateKey = (
	componentType: string,
	componentId: string,
	viewId: string | undefined
) => `${viewId}/${componentType}/${componentId}`

const componentAdapter = createEntityAdapter<ComponentState>({
	selectId: (component) =>
		getComponentStateKey(
			component.componentType,
			component.id,
			component.view
		),
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
export { selectors, getComponentStateKey }
export default componentSlice.reducer
