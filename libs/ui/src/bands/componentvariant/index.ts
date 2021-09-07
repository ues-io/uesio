import { createSlice } from "@reduxjs/toolkit"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, parse } from "../../yamlutils/yamlutils"
import componentVariantAdapter from "./adapter"
import { parseVariantKey } from "../../component/path"
import { ComponentVariant } from "./types"

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
				const variantsToAdd: Record<string, ComponentVariant> = {}
				Object.keys(variants).forEach((key) => {
					const [, , variantNamespace] = parseVariantKey(key)
					variants[key].namespace = variantNamespace
					if (state.entities[key]) return
					variantsToAdd[key] = variants[key]
				})

				if (!Object.keys(variantsToAdd).length) return
				componentVariantAdapter.upsertMany(state, variantsToAdd)
			}
		})
	},
})

export default componentVariantSlice.reducer
