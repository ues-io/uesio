import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import loadOp from "../viewdef/operations/load"
import { parse } from "../../yamlutils/yamlutils"
import componentVariantAdapter from "./adapter"

const componentVariantSlice = createSlice({
	name: "componentVariant",
	initialState: componentVariantAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loadOp.fulfilled, (state, { payload }) => {
			const yamlDoc = parse(payload)
			const dependenciesDoc = yamlDoc.dependencies.componentvariants
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
