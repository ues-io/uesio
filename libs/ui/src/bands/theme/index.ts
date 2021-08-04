import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import themeAdapter from "./adapter"
import ops from "./operations"
import { parse } from "../../yamlutils/yamlutils"
import { defaultTheme } from "../../styles/styles"

const themeSlice = createSlice({
	name: "theme",
	initialState: themeAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			ops.fetchTheme.fulfilled,
			(state, { payload }: PayloadAction<string>) => {
				const { namespace, name, definition } = parse(payload)
				return themeAdapter.upsertOne(state, {
					namespace,
					name,
					definition: {
						...defaultTheme.definition,
						...definition,
					},
				})
			}
		)
	},
})

export default themeSlice.reducer
