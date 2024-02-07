import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { RouteAssignmentState } from "../../definition/routeassignment"
import { RootState } from "../../store/store"

const adapter = createEntityAdapter<RouteAssignmentState>({
	selectId: (assignment) => assignment.name,
})

const selectors = adapter.getSelectors(
	(state: RootState) => state.routeassignment
)

const selectById = (state: RootState, name: string) =>
	selectors.selectById(state, name)

const selectAll = (state: RootState) => selectors.selectAll(state)

const metadataSlice = createSlice({
	name: "routeassignment",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

export { selectById, selectAll, selectors, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
