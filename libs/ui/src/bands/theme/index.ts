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

const fetchTheme = createAsyncThunk<
	Theme,
	{
		namespace: string
		name: string
		route: ThemeState["route"]
		context: Context
	},
	UesioThunkAPI
>(themefetchActionType, async ({ namespace, name, context }, api) =>
	api.extra.getTheme(context, namespace, name)
)

const fetchedThemeReducer = (
	state: EntityState<ThemeState>,
	{ meta: { arg }, payload }
) => {
	// set all entities' property "isCurrentTheme" to false
	state.entities = Object.entries(state.entities).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key]: {
				...value,
				isCurrentTheme: false,
			},
		}),
		{}
	)

	themeAdapter.upsertOne(state, {
		...arg,
		theme: payload,
		isFetching: false,
		isCurrentTheme: true,
	})
}

const fetchingThemeReducer = (
	state: EntityState<ThemeState>,
	{ meta: { arg } }: PayloadAction<Theme>
) => {
	themeAdapter.upsertOne(state, {
		...arg,
		isFetching: true,
	})
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
