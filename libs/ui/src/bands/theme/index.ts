import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Theme, themefetchActionType, ThemeState } from "./types"
import { Platform } from "../../platform/platform"
import { Context } from "../../context/context"

const fetchTheme = createAsyncThunk<
	Theme,
	{
		themeNamespace: string
		themeName: string
		platform: Platform
		context: Context
	}
>(
	themefetchActionType,
	async ({ themeNamespace, themeName, platform, context }, thunkApi) => {
		const themeResponse = await platform?.getTheme(
			context,
			themeNamespace,
			themeName
		)
		return themeResponse as Theme
	}
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
			(state, { payload }: PayloadAction<Theme>) => {
				return {
					routeTheme: payload,
					isFetching: false,
				}
			}
		)
		builder.addCase(fetchTheme.pending, (state, { payload }) => {
			return {
				...state,
				isFetching: true,
			}
		})
	},
})

export { fetchTheme }
export default themeSlice.reducer
