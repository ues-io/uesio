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
import themeAdapter, { getThemeId } from "./adapter"
import { createEntityReducer, EntityPayload } from "../../bands/utils"

const fetchTheme = createAsyncThunk<
	Theme,
	{
		namespace: string
		name: string
		context: Context
		workspace: Theme["workspace"]
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
	{ payload }: PayloadAction<Theme>
) => {
	console.log("payload fetchedThemeReducer", payload)
	const themeId = getThemeId({
		...payload,
		theme: `${payload.namespace}.${payload.name}`,
	})
	console.log("themeId fetchedThemeReducer", themeId)

	const entityState = state.entities?.[themeId]
	if (entityState) {
		entityState.routeTheme = payload
		entityState.isFetching = false
	} else {
		state.entities = {
			[themeId]: {
				routeTheme: payload,
				isFetching: false,
			},
		}
	}
}

const fetchingThemeReducer = (
	state: EntityState<ThemeState>,
	{ meta: { arg } }: PayloadAction<Theme>
) => {
	const themeId = getThemeId({
		...arg,
		theme: `${arg.namespace}.${arg.name}`,
	})
	const entityState = state.entities?.[themeId]
	if (entityState) {
		entityState.isFetching = true
	} else {
		state.entities = {
			[themeId]: {
				isFetching: true,
			},
		}
	}
}

const themeSlice = createSlice({
	name: "theme",
	initialState: themeAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchTheme.fulfilled, fetchedThemeReducer)
		builder.addCase(fetchTheme.pending, fetchingThemeReducer)
	},
})

export { fetchTheme }
export default themeSlice.reducer
