import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, parse } from "../../yamlutils/yamlutils"
import componentVariantAdapter from "./adapter"
import { parseVariantKey } from "../../component/path"

const componentVariantSlice = createSlice({
	name: "componentVariant",
	initialState: componentVariantAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loadOp.fulfilled, (state, { payload }) => {
			const yamlDoc = parse(payload)
			const variants = getNodeAtPath(
				["dependencies", "componentvariants"],
				yamlDoc.contents
			)?.toJSON()
			if (variants) {
				Object.keys(variants).forEach((key) => {
					const [, , variantNamespace] = parseVariantKey(key)
					variants[key].namespace = variantNamespace
				})
				componentVariantAdapter.upsertMany(state, variants)
			}
		})
	},
})

export const { selectAll } = componentVariantAdapter.getSelectors(
	(state: RootState) => state.componentvariant
)

export default componentVariantSlice.reducer
