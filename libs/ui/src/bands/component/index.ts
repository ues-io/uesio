import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { ComponentState } from "./types"
import { set as setRoute } from "../route"

const adapter = createEntityAdapter({
	selectId: (component: ComponentState) => component.id,
})

const componentSlice = createSlice({
	name: "component",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
		removeMany: adapter.removeMany,
		removeOne: adapter.removeOne,
	},
	extraReducers: (builder) => {
		builder.addCase(setRoute, adapter.removeAll)
	},
})

const selectors = adapter.getSelectors((state: RootState) => state.component)
export const { set, setMany, removeMany, removeOne } = componentSlice.actions
export { selectors, adapter }
export default componentSlice.reducer
