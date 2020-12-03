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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
			(state, { payload }: PayloadAction<Theme>) => ({
				routeTheme: payload,
				isFetching: false,
			})
		)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		builder.addCase(fetchTheme.pending, (state, { payload }) => ({
			...state,
			isFetching: true,
		}))
	},
})

export { fetchTheme }
export default themeSlice.reducer
