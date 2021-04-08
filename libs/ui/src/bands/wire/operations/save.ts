import { createAsyncThunk } from "@reduxjs/toolkit"

import { Context, getWireDef } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { SaveResponseBatch } from "../../../load/saveresponse"
import { getWiresFromDefinitonOrContext } from "../adapter"
import { getFullWireId } from "../selectors"

export default createAsyncThunk<
	SaveResponseBatch,
	{
		context: Context
		wires?: string[]
	},
	UesioThunkAPI
>("wire/save", async ({ context, wires }, api) => {
	// Turn the list of wires into a load request
	const wiresToSave = getWiresFromDefinitonOrContext(wires, context)
	const response = await api.extra.saveData(context, {
		wires: wiresToSave.map((wire) => {
			const wiredef = getWireDef(wire)
			if (!wiredef || !wire) throw new Error("Invalid Wire: " + wire)
			return {
				wire: getFullWireId(wire.view, wire.name),
				collection: wiredef.collection,
				changes: wire.changes,
				deletes: wire.deletes,
			}
		}),
	})
	return response
})
