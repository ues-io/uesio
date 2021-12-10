import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { selectors as viewDefSelectors } from "../../viewdef/adapter"
import loadWiresOp from "../../wire/operations/load"
import loadViewDefOp from "../../viewdef/operations/load"
import initializeWiresOp from "../../wire/operations/initialize"
import { PlainView, ViewParams } from "../types"
import { runMany } from "../../../signals/signals"

export default createAsyncThunk<
	PlainView,
	{
		context: Context
		path: string
		params: ViewParams | undefined
	},
	UesioThunkAPI
>("view/load", async ({ context, path }, api) => {
	// First check to see if we have the viewDef
	const viewDefId = context.getViewDefId()
	if (!viewDefId) throw new Error("No View Def Context Provided")
	let viewDef = viewDefSelectors.selectById(api.getState(), viewDefId)
	if (!viewDef) {
		await api.dispatch(
			loadViewDefOp({
				context,
			})
		)
	}
	viewDef = viewDefSelectors.selectById(api.getState(), viewDefId)
	if (!viewDef) throw new Error("Could not get View Def")
	const wires = viewDef.definition?.wires
	const wireNames = wires ? Object.keys(wires) : []

	// Initialize Wires
	api.dispatch(initializeWiresOp(context, wireNames))

	if (wireNames?.length) {
		await api.dispatch(
			loadWiresOp({
				context,
				wires: wireNames,
			})
		)
	}

	// Handle Events
	const onloadEvents = viewDef.definition.events?.onload
	if (onloadEvents) {
		await runMany(api.dispatch, "", onloadEvents, context)
	}

	return {
		namespace: viewDef.namespace,
		name: viewDef.name,
		path,
		loaded: true,
	}
})
