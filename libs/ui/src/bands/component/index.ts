import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentState } from "./types"
import { set as setRoute } from "../route"

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
	extraReducers: (builder) => {
		builder.addCase(setRoute, componentAdapter.removeAll)
	},
})

const selectors = componentAdapter.getSelectors(
	(state: RootState) => state.component
)
export const { set } = componentSlice.actions
export { selectors, getComponentStateKey }
export default componentSlice.reducer
