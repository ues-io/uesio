import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Theme, actionTypes } from "./types"

const fetchTheme = createAsyncThunk<
	Theme,
	{
		themeNamespace: string
		themeName: string
	}
>(actionTypes.themefetch, async (theme, _) => {
	const { themeNamespace, themeName } = theme
	const response = await fetch(
		`https://uesio-dev.com:3000/workspace/crm/dev/themes/${themeNamespace}/${themeName}`
	)
	const parsed = (await response.json()) as Theme
	return parsed
})

const themeSlice = createSlice({
	name: "theme",
	initialState: {},
	reducers: {
		fetchTheme: (state, { payload }: PayloadAction<Theme>) => {
			console.log(" fetching", payload)
			return {
				...state,
				...payload,
				isFetching: true,
			}
		},
	},
	extraReducers: {
		// @ts-ignore
		[fetchTheme.fulfilled]: (state, action) => {
			// Add user to the state array
			console.log("reducer fetched", action)
			return {
				...state,
				...action.payload,
				isFetching: false,
			}
		},
	},
})

export { fetchTheme }
export default themeSlice.reducer
