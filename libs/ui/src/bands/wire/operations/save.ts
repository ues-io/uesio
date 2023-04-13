import { Context } from "../../../context/context"
import { SaveResponse, SaveResponseBatch } from "../../../load/saveresponse"
import {
	getWiresFromDefinitonOrContext,
	save,
	getFullWireId,
	getWireParts,
} from ".."
import { dispatch } from "../../../store/store"
import { getErrorString } from "../../utils"
import { platform } from "../../../platform/platform"

const getErrorStrings = (response: SaveResponse) =>
	response.errors?.map((error) => error.message) || []

export default async (context: Context, wires?: string[]) => {
	// Turn the list of wires into a load request
	const wiresToSave = getWiresFromDefinitonOrContext(wires, context)
	const response: SaveResponseBatch = {
		wires: [],
	}

	const requests = wiresToSave.flatMap((wire) => {
		const wireId = getFullWireId(wire.view, wire.name)
		const hasChanges = Object.keys(wire.changes).length
		const hasDeletes = Object.keys(wire.deletes).length
		// Check to see if we need to go to the serve
		if (!hasChanges && !hasDeletes) {
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
				collection: wire.collection,
				changes: wire.changes || {},
				deletes: wire.deletes || {},
			},
		]
	})

	if (!requests.length) {
		return context
	}

	// Combine the server responses with the ones that did not need to go to the server.
	try {
		const serverResponse = await platform.saveData(context, {
			wires: requests,
		})
		serverResponse.wires.forEach((wire) => {
			response.wires.push(wire)
		})
	} catch (error) {
		const message = getErrorString(error)

		requests.forEach((req) => {
			response.wires.push({
				wire: req.wire,
				errors: [
					{
						message,
					},
				],
				changes: {},
				deletes: {},
			})
		})
	}

	dispatch(save(response))

	let resultContext
	const errorsByWire = response.wires.reduce((acc, wire) => {
		const errors = getErrorStrings(wire)
		if (errors.length) {
			const [, name] = getWireParts(wire.wire)
			acc[name] = errors
		}
		return acc
	}, {} as Record<string, string[]>)

	// Special handling for saves of just one wire and one record
	if (response?.wires.length === 1) {
		const wire = response.wires[0]
		const changes = wire.changes
		const changeKeys = Object.keys(changes)
		if (changeKeys.length === 1) {
			const [, name] = getWireParts(wire.wire)
			const errors = getErrorStrings(wire)
			resultContext = context.addRecordFrame({
				wire: name,
				record: changeKeys[0],
			})
			if (errors.length)
				resultContext = resultContext.addErrorFrame(
					getErrorStrings(wire)
				)
		}
	}

	if (!resultContext) {
		const errors = response.wires.flatMap(getErrorStrings)
		resultContext =
			errors.length > 0 ? context.addErrorFrame(errors) : context
	}
	// Run wire events
	wiresToSave.forEach((w) => {
		const wireObject = context.getWire(w.name)
		if (errorsByWire[w.name]) {
			wireObject?.handleEvent(
				"onSaveError",
				context.addErrorFrame(errorsByWire[w.name])
			)
		} else {
			wireObject?.handleEvent("onSaveSuccess", context)
		}
	})

	return resultContext
}
