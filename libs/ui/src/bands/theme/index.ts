import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import themeAdapter from "./adapter"
import ops from "./operations"
import { getNodeAtPath, parse, YAML_OPTIONS } from "../../yamlutils/yamlutils"
import yaml from "yaml"

const themeSlice = createSlice({
	name: "theme",
	initialState: themeAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			ops.fetchTheme.fulfilled,
			(state, { payload }: PayloadAction<string>) => {
				const yamlDoc = parse(payload)
				const defDoc = new yaml.Document(YAML_OPTIONS)
				defDoc.contents = getNodeAtPath("definition", yamlDoc.contents)

				return themeAdapter.upsertOne(state, {
					namespace: yamlDoc.get("namespace"),
					name: yamlDoc.get("name"),
					definition: defDoc.toJSON(),
				})
			}
		)
	},
})

export default themeSlice.reducer
