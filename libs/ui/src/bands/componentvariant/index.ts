import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, parse } from "../../yamlutils/yamlutils"
import componentVariantAdapter from "./adapter"

const componentVariantSlice = createSlice({
	name: "componentVariant",
	initialState: componentVariantAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loadOp.fulfilled, (state, { payload }) => {
			const yamlDoc = parse(payload)
			const dependenciesDoc = getNodeAtPath(
				["dependencies", "componentvariants"],
				yamlDoc.contents
			)?.toJSON()
			if (dependenciesDoc) {
				componentVariantAdapter.upsertMany(state, dependenciesDoc)
			}
		})
	},
})

export const { selectAll } = componentVariantAdapter.getSelectors(
	(state: RootState) => state.componentvariant
)

export default componentVariantSlice.reducer
