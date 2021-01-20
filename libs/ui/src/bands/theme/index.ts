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
	const themeId = getThemeId(payload)
	console.log("themeId reducer", themeId)

	const entityState = state.entities[themeId]
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
	{ payload }: PayloadAction<Theme>
) => {
	console.log("state", JSON.stringify(state, undefined, 2))
	console.log("fetchTheme", JSON.stringify(fetchTheme, undefined, 2))
	console.log("payload", payload)
	/*
	const themeId = `${payload?.workspace || payload.namespace}.${payload.name}`

	state.entities[themeId].isFetching = true
	*/
}

const themeSlice = createSlice({
	name: "theme",
	initialState: themeAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchTheme.fulfilled, fetchedThemeReducer)
		//	builder.addCase(fetchTheme.pending, fetchingThemeReducer)
	},
})

export { fetchTheme }
export default themeSlice.reducer
