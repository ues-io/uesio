// @ts-nocheck
import {
	createAsyncThunk,
	createSlice,
	EntityState,
	PayloadAction,
} from "@reduxjs/toolkit"
import { Theme, themefetchActionType, ThemeState } from "./types"
import { Context } from "../../context/context"
import { UesioThunkAPI } from "../utils"
import themeAdapter from "./adapter"
import { createEntityReducer, EntityPayload } from "../../bands/utils"

const fetchTheme = createAsyncThunk<
	Theme,
	{
		namespace: string
		name: string
		context: Context
	},
	UesioThunkAPI
>(themefetchActionType, async ({ namespace, name, context }, api) =>
	api.extra.getTheme(context, namespace, name)
)

/*|| {
	routeTheme: undefined,
	isFetching: false,
}*/

const fetchedThemeReducer = (
	state: EntityState<ThemeState>,
	payload: Theme
) => {
	const entityState = state.entities[payload.id]
	if (entityState) {
		entityState.routeTheme = payload
		entityState.isFetching = false
	}
}

const themeSlice = createSlice({
	name: "theme",
	initialState: themeAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchTheme.fulfilled, fetchedThemeReducer)
		builder.addCase(fetchTheme.pending, (state) => ({
			...state,
			isFetching: true,
		}))
	},
})

export { fetchTheme }
export default themeSlice.reducer
