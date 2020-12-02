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
