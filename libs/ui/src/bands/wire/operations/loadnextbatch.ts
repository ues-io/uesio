import { Context } from "../../../context/context"
import { PlainWire } from "../types"
import {
	getFullWireId,
	getWireParts,
	getWiresFromDefinitonOrContext,
	load,
} from ".."
import { getWireRequest } from "./load"
import { dispatch } from "../../../store/store"
import { platform } from "../../../platform/platform"

function getWiresMap(wires: PlainWire[]) {
	const wiresMap: Record<string, PlainWire> = {}
	wires.forEach((wire) => {
		const fullWireId = getFullWireId(wire.view, wire.name)
		wiresMap[fullWireId] = wire
	})
	return wiresMap
}

export default async (context: Context, wires?: string[]) => {
	// Turn the list of wires into a load request
	const wiresToLoad = getWiresFromDefinitonOrContext(wires, context)
	const response = await platform.loadData(context, {
		wires: getWireRequest(wiresToLoad, false, context, true),
	})

	// Add in the local ids
	const wiresRequestMap = getWiresMap(wiresToLoad)
	const wiresResponse: Record<string, PlainWire> = {}
	for (const wire of response?.wires || []) {
		const requestWire = wiresRequestMap[wire.name]
		const [view, name] = getWireParts(wire.name)

		wiresResponse[wire.name] = {
			...requestWire,
			name,
			view,
			query: true,
			batchid: requestWire.batchid,
			data: {
				...requestWire.data,
				...wire.data,
			},
			original: {
				...requestWire.original,
				...wire.original,
			},
			changes: requestWire.changes,
			deletes: requestWire.deletes,
			batchnumber: requestWire.batchnumber + 1,
			more: wire.more,
			errors: undefined,
			conditions: requestWire.conditions,
			order: requestWire.order,
			collection: wire.collection,
		}
	}

	dispatch(load([Object.values(wiresResponse), response.collections]))
	return context
}
