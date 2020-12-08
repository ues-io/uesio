import { createAsyncThunk } from "@reduxjs/toolkit"

import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { SaveResponseBatch } from "../../../load/saveresponse"
import { selectors } from "../adapter"

export default createAsyncThunk<
	[SaveResponseBatch, string],
	{
		context: Context
		wires: string[]
	},
	UesioThunkAPI
>("wire/save", async ({ context, wires }, api) => {
	// Turn the list of wires into a load request
	const viewId = context.getViewId()
	if (!viewId) throw new Error("No View Provided")
	const batch = {
		wires: wires.map((wirename) => {
			const wiredef = context.getWireDef(wirename)
			const wire = selectors.selectById(
				api.getState(),
				viewId + "/" + wirename
			)
			if (!wiredef || !wire) throw new Error("Invalid Wire: " + wire)
			return {
				wire: wirename,
				collection: wiredef.collection,
				changes: wire.changes,
				deletes: wire.deletes,
			}
		}),
	}
	const response = await api.extra.saveData(context, batch)
	return [response, viewId]
})
