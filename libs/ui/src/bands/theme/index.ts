import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Theme, themefetchActionType, ThemeState } from "./types"

const fetchTheme = createAsyncThunk<
	Theme,
	{
		themeNamespace: string
		themeName: string
	}
>(themefetchActionType, async ({ themeNamespace, themeName }, thunkApi) => {
	const response = await fetch(
		`https://uesio-dev.com:3000/workspace/crm/dev/themes/${themeNamespace}/${themeName}`
	)
	const parsed = await response.json()
	return parsed as Theme
})

const initialState: ThemeState = {
	theme: undefined,
	isFetching: false,
}

const themeSlice = createSlice({
	name: "theme",
	initialState: initialState,
	reducers: {},
	extraReducers: {
		// @ts-ignore
		[fetchTheme.pending]: (state, action) => {
			state.isFetching = true
		},
		// @ts-ignore
		[fetchTheme.fulfilled]: (state, action: PayloadAction<Theme>) => {
			// Add user to the state array
			console.log("reducer fetched", action)
			return {
				theme: action.payload,
				isFetching: false,
			}
		},
	},
})

export { fetchTheme }
export default themeSlice.reducer
