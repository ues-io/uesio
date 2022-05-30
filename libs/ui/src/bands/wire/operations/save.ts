import { createAsyncThunk } from "@reduxjs/toolkit"
import { PlainWire } from "../types"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { SaveResponseBatch } from "../../../load/saveresponse"
import { getFullWireId } from "../selectors"

const sortWires = (wiresToSave: PlainWire[]) => {
	const save = []
	const response = []
	for (const wire of wiresToSave) {
		const wireId = getFullWireId(wire.view, wire.name)
		const wireHasChanges = !!(
			Object.keys(wire.changes).length || Object.keys(wire.deletes).length
		)
		wireHasChanges
			? save.push({
					wire: wireId,
					collection: wire.collection,
					changes: wire.changes,
					deletes: wire.deletes,
			  })
			: response.push({
					wire: wireId,
					errors: [],
					changes: {},
					deletes: {},
			  })
	}
	return { saveRequest: { wires: save }, response: { wires: response } }
}

export default createAsyncThunk<
	SaveResponseBatch,
	{
		context: Context
		wiresToSave: PlainWire[]
	},
	UesioThunkAPI
>("wire/save", async ({ context, wiresToSave }, api) => {
	// Turn the list of wires into a load request
	const { saveRequest, response } = sortWires(wiresToSave)

	if (!saveRequest.wires.length) {
		return response
	}
	// Combine the server responses with the ones that did not need to go to the server.
	const serverResponse = await api.extra.saveData(context, saveRequest)
	return {
		wires: [...response.wires, ...serverResponse.wires],
	}
})
