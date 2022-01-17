import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import labelAdapter from "./adapter"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, parse } from "../../yamlutils/yamlutils"
import { parseKey } from "../../component/path"

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
					Object.keys(labels).map((key) => {
						const [namespace, name] = parseKey(key)
						return {
							namespace,
							name,
							value: labels[key],
						}
					})
				)
			}
		)
	},
})

export default labelSlice.reducer
