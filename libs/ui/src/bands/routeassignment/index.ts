import { createSlice, createEntityAdapter } from "@reduxjs/toolkit"
import { RouteAssignmentState } from "../../definition/routeassignment"
import { RootState } from "../../store/store"
import { getKey } from "../../metadata/metadata"

const adapter = createEntityAdapter<RouteAssignmentState>({
	selectId: getKey,
})

const selectors = adapter.getSelectors(
	(state: RootState) => state.routeassignment
)

const selectById = (state: RootState, name: string) =>
	selectors.selectById(state, name)

const metadataSlice = createSlice({
	name: "routeassignment",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
})

export { selectById, selectors, adapter }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
