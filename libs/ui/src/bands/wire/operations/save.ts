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
import { ID_FIELD } from "../../collection/types"
import { PlainWireRecord } from "../../wirerecord/types"

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

		const deletes = wire.deletes
		const changes = wire.changes

		const serverChanges: Record<string, PlainWireRecord> = {}
		const serverDeletes: Record<string, PlainWireRecord> = {}
		const clientChanges: Record<string, PlainWireRecord> = {}
		const clientDeletes: Record<string, PlainWireRecord> = {}

		// If we're deleting this item, then we don't need to process its changes.
		Object.keys(changes).forEach((key) => {
			if (!deletes[key]) {
				serverChanges[key] = changes[key]
			} else {
				clientChanges[key] = {}
			}
		})

		// If we're trying to delete an item that was never persisted, don't bother.
		Object.keys(deletes).forEach((key) => {
			if (deletes[key][ID_FIELD]) {
				serverDeletes[key] = deletes[key]
			} else {
				clientDeletes[key] = {}
			}
		})

		response.wires.push({
			wire: wireId,
			errors: [],
			changes: clientChanges,
			deletes: clientDeletes,
		})

		const hasServerChanges = Object.keys(serverChanges).length
		const hasServerDeletes = Object.keys(serverDeletes).length

		return hasServerChanges || hasServerDeletes
			? [
					{
						wire: wireId,
						collection: wire.collection,
						changes: serverChanges,
						deletes: serverDeletes,
					},
			  ]
			: []
	})

	if (requests.length) {
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
