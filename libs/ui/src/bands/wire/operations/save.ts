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
	const response: SaveResponseBatch = {
		wires: [],
	}
	const saveRequest = {
		wires: wiresToSave.flatMap((wire) => {
			const wiredef = getWireDef(wire)
			if (!wiredef || !wire) throw new Error("Invalid Wire: " + wire)
			const wireId = getFullWireId(wire.view, wire.name)
			// Check to see if we need to go to the serve
			if (
				!Object.keys(wire.changes).length &&
				!Object.keys(wire.deletes).length
			) {
				response.wires.push({
					wire: wireId,
					errors: [],
					changes: {},
					deletes: {},
				})
				return []
			}
			return [
				{
					wire: wireId,
					collection: wiredef.collection,
					changes: wire.changes,
					deletes: wire.deletes,
				},
			]
		}),
	}

	if (!saveRequest.wires.length) {
		return response
	}
	// Combine the server responses with the ones that did not need to go to the server.
	const serverResponse = await api.extra.saveData(context, saveRequest)
	serverResponse.wires.forEach((wire) => {
		response.wires.push(wire)
	})
	return response
})
