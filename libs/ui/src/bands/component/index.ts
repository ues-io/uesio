import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentState } from "./types"
import { set as setRoute } from "../route"
import { Context } from "../../context/context"
import { useSelector } from "react-redux"

const componentAdapter = createEntityAdapter<ComponentState>({
	selectId: (component) => component.id,
})

const makeComponentId = (
	context: Context,
	componentType: string,
	id: string,
	noRecordContext?: boolean
) => {
	const viewId = context.getViewId()
	const recordId = context.getRecordId()
	const recordSuffix = !noRecordContext && recordId ? `:${recordId}` : ""
	return `${viewId}:${componentType}:${id}${recordSuffix}`
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

const useAllComponents = () => useSelector(selectors.selectAll)

export const { set } = componentSlice.actions
export { selectors, makeComponentId, useAllComponents }
export default componentSlice.reducer
