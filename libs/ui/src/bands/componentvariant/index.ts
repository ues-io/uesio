import { createSlice } from "@reduxjs/toolkit"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, newDoc, parse } from "../../yamlutils/yamlutils"
import componentVariantAdapter from "./adapter"
import { parseVariantKey } from "../../component/path"
import { ComponentVariant } from "./types"
import { Scalar, YAMLMap } from "yaml"

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
			) as YAMLMap<Scalar<string>, YAMLMap>

			if (variants) {
				const variantsToAdd: Record<string, ComponentVariant> = {}
				variants.items.forEach((item) => {
					const key = item.key.value
					if (state.entities[key]) return
					const [, , variantNamespace] = parseVariantKey(key)
					const definition = item.value?.get("definition") as YAMLMap
					const defDoc = newDoc()
					defDoc.contents = definition
					variantsToAdd[key] = {
						name: item.value?.get("name") as string,
						label: item.value?.get("label") as string,
						component: item.value?.get("component") as string,
						extends: item.value?.get("extends") as string,
						namespace: variantNamespace,
						definition: definition.toJSON() || {},
						yaml: defDoc,
						originalYaml: defDoc,
					}
				})

				if (!Object.keys(variantsToAdd).length) return
				componentVariantAdapter.upsertMany(state, variantsToAdd)
			}
		})
	},
})

export default componentVariantSlice.reducer
