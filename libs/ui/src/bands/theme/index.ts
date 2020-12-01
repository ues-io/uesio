import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Theme } from "./themetypes"

const fetchTheme = createAsyncThunk(
	"theme/fetch",
	async (themeNamespace, themeName, thunkAPI) => {
		const response = await fetch(
			`https://uesio-dev.com:3000/workspace/crm/dev/themes/${themeNamespace}/${themeName}`
		)
		const parsed = await response.json()
		return parsed
	}
)

const initialState = {}

const themeSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		whatever: (state, { payload }: PayloadAction<Theme>) => {
			console.log(" slice theme payload", payload)
			return {
				...state,
				...payload,
				isFetching: false,
			}
		},
	},
	extraReducers: {
		// Add reducers for additional action types here, and handle loading state as needed
		//@ts-ignore
		[fetchTheme.fulfilled]: (state, action) => {
			// Add user to the state array
			console.log("reducer slice")
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
