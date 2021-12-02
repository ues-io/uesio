import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import labelAdapter from "./adapter"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, parse, newDoc } from "../../yamlutils/yamlutils"
import { defaultTheme } from "../../styles/styles"
import merge from "lodash/merge"

const labelSlice = createSlice({
	name: "label",
	initialState: labelAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			loadOp.fulfilled,
			(state, { payload }: PayloadAction<string>) => {
				const yamlDoc = parse(payload)
				const defDoc = newDoc()
				defDoc.contents = getNodeAtPath("definition", yamlDoc.contents)
				return labelAdapter.upsertOne(state, {
					name: yamlDoc.get("name") as string,
					value: merge({}, defaultTheme.definition, defDoc.toJSON()),
				})
			}
		)
	},
})

export default labelSlice.reducer
