import { Context } from "../../../context/context"
import { PlainWire } from "../types"
import { getFullWireId, getWiresFromDefinitonOrContext, load } from ".."
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
	const loadRequests = getWireRequest(context, wiresToLoad).map(
		(loadRequest) => {
			loadRequest.batchnumber = (loadRequest.batchnumber || 0) + 1
			loadRequest.query = true
			return loadRequest
		}
	)
	const response = await platform.loadData(context, {
		wires: loadRequests,
	})

	// Add in the local ids
	const wiresRequestMap = getWiresMap(wiresToLoad)
	const wiresResponse: Record<string, PlainWire> = {}
	for (const wire of response?.wires || []) {
		const view = context.getViewId()
		const wireName = getFullWireId(view, wire.name)
		const requestWire = wiresRequestMap[wireName]

		wiresResponse[wire.name] = {
			...requestWire,
			name: wire.name,
			view,
			query: true,
			batchid: requestWire.batchid,
			batchnumber: wire.batchnumber,
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
