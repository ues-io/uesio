import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Theme, actionTypes, ThemeState } from "./types"

const fetchTheme = createAsyncThunk<
	Theme,
	{
		themeNamespace: string
		themeName: string
	}
>(actionTypes.themefetch, async ({ themeNamespace, themeName }, _) => {
	const response = await fetch(
		`https://uesio-dev.com:3000/workspace/crm/dev/themes/${themeNamespace}/${themeName}`
	)
	const parsed = (await response.json()) as Theme
	return parsed
})

const themeSlice = createSlice({
	name: "theme",
	initialState: {
		theme: null,
		isFetching: false,
	},
	reducers: {},
	extraReducers: {
		// @ts-ignore
		[fetchPosts.pending]: (state, action) => {
			state.isFetching = true
		},
		// @ts-ignore
		[fetchTheme.fulfilled]: (state, action) => {
			// Add user to the state array
			console.log("reducer fetched", action)
			return {
				...(state || {}),
				...action.payload,
				isFetching: false,
			}
		},
	},
})

export { fetchTheme }
export default themeSlice.reducer
