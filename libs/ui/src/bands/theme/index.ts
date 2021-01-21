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

const fetchTheme = createAsyncThunk<
	Theme,
	{
		theme: string
		namespace: string
		name: string
		routeWorkspace: ThemeState["routeWorkspace"]
		context: Context
	},
	UesioThunkAPI
>(themefetchActionType, async ({ namespace, name, context }, api) =>
	api.extra.getTheme(context, namespace, name)
)

const fetchedThemeReducer = (
	state: EntityState<ThemeState>,
	{ payload }: PayloadAction<Theme>
) => {
	const themeId = getThemeId({
		...payload,
		theme: `${payload.namespace}.${payload.name}`,
	})
	const entityState = state.entities?.[themeId]

	// set all entities properties isCurrentTheme to false
	/*	state.entities = Object.entries(state.entities).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key]: {
				...value,
				isCurrentTheme: false,
			},
		}),
		{}
	)
*/
	if (entityState) {
		entityState.routeTheme = payload
		entityState.isFetching = false
		entityState.isCurrentTheme = true
	} else {
		state.entities = {
			[themeId]: {
				routeTheme: payload,
				isFetching: false,
				isCurrentTheme: true,
			},
		}
	}

	if (state.ids.indexOf(themeId) === -1) {
		state.ids.push(themeId)
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

	// update existing theme
	if (entityState) {
		entityState.isFetching = true
	}
	// add a new theme
	else {
		state.entities = {
			[themeId]: {
				themeId,
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
