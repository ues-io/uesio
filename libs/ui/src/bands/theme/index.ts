import { createAsyncThunk, createSlice, EntityState } from "@reduxjs/toolkit"
import { Theme, themefetchActionType, ThemeState } from "./types"
import { Context } from "../../context/context"
import { UesioThunkAPI } from "../utils"
import themeAdapter from "./adapter"

type thunkArg = {
	namespace: string
	name: string
	route: ThemeState["route"]
	context: Context
}
const fetchTheme = createAsyncThunk<Theme, thunkArg, UesioThunkAPI>(
	themefetchActionType,
	async ({ namespace, name, context }, api) =>
		api.extra.getTheme(context, namespace, name)
)

const fetchedThemeReducer = (
	state: EntityState<ThemeState>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	asyncThunk: any
) => {
	const {
		meta: { arg },
		payload,
	} = asyncThunk

	// set all entities' property "isActiveTheme" to false
	state.entities = Object.entries(state.entities).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key]: {
				...value,
				isActiveTheme: false,
			},
		}),
		{}
	)

	themeAdapter.upsertOne(state, {
		...arg,
		theme: payload,
		isFetching: false,
		isActiveTheme: true,
	})
}

const fetchingThemeReducer = (
	state: EntityState<ThemeState>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	asyncThunk: any
) => {
	const {
		meta: { arg },
	} = asyncThunk
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
