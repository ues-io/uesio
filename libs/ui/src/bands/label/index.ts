import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import labelAdapter from "./adapter"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, parse } from "../../yamlutils/yamlutils"

const labelSlice = createSlice({
	name: "label",
	initialState: labelAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			loadOp.fulfilled,
			(state, { payload }: PayloadAction<string>) => {
				const yamlDoc = parse(payload)
				const labels = getNodeAtPath(
					"dependencies.labels",
					yamlDoc.contents
				)?.toJSON()
				if (!labels) return
				return labelAdapter.upsertMany(
					state,
					Object.keys(labels).map((key) => ({
						namespace: key.split(".")[0],
						name: labels[key].name,
						value: labels[key].value,
					}))
				)
			}
		)
	},
})

export default labelSlice.reducer
