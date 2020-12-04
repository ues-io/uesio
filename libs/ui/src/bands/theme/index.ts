import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Theme, themefetchActionType, ThemeState } from "./types"
import { Context } from "../../context/context"
import { UesioThunkAPI } from "../utils"

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

const initialState: ThemeState = {
	routeTheme: undefined,
	isFetching: false,
}

const themeSlice = createSlice({
	name: "theme",
	initialState: initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			fetchTheme.fulfilled,
			(state, { payload }: PayloadAction<Theme>) => ({
				routeTheme: payload,
				isFetching: false,
			})
		)
		builder.addCase(fetchTheme.pending, (state) => ({
			...state,
			isFetching: true,
		}))
	},
})

export { fetchTheme }
export default themeSlice.reducer
