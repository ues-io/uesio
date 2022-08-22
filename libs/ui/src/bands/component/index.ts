import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentState } from "./types"
import { set as setRoute } from "../route"
import { Context } from "../../context/context"

const componentAdapter = createEntityAdapter<ComponentState>({
	selectId: (component) => component.id,
})

const makeComponentId = (
	context: Context,
	componentType: string,
	id: string
) => {
	const viewId = context.getViewId()
	return `${viewId}:${componentType}:${id}`
}

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
export { selectors, makeComponentId }
export default componentSlice.reducer
