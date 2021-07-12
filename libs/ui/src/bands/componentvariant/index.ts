import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { useSelector } from "react-redux"
import shortid from "shortid"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, newDoc, parse } from "../../yamlutils/yamlutils"

const componentVariantAdapter = createEntityAdapter({
	selectId: ({ component, name }) => component + "." + name,
})

const componentVariantSlice = createSlice({
	name: "componentVariant",
	initialState: componentVariantAdapter.getInitialState(),
	reducers: {
		set: componentVariantAdapter.setAll,
	},
	extraReducers: (builder) => {
		builder.addCase(loadOp.fulfilled, (state, action) => {
			const yamlDoc = parse(action.payload)

			const defDoc = newDoc()
			defDoc.contents = getNodeAtPath("definition", yamlDoc.contents)
			const dependenciesDoc = getNodeAtPath(
				["dependencies", "componentvariants"],
				yamlDoc.contents
			)?.toJSON()

			componentVariantAdapter.setAll(state, dependenciesDoc)
		})
	},
})

export const { selectAll } = componentVariantAdapter.getSelectors(
	(state: RootState) => state.componentVariant
)

// export const { set } = componentVariantSlice.actions

export default componentVariantSlice.reducer
