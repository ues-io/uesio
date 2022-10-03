import { Context } from "../../../context/context"
import { LoadRequest } from "../../../load/loadrequest"
import { PlainWire } from "../types"
import { listLookupWires } from "../utils"
import { getWiresFromDefinitonOrContext, load, getFullWireId } from ".."
import { ThunkFunc } from "../../../store/store"
import createrecord from "./createrecord"
import partition from "lodash/partition"
import { batch } from "react-redux"

// TODO: We can probably get rid of this when we
function getWiresMap(wires: PlainWire[]) {
	const wiresMap: Record<string, PlainWire> = {}
	wires.forEach((wire) => {
		const fullWireId = getFullWireId(wire.view, wire.name)
		wiresMap[fullWireId] = wire
	})
	return wiresMap
}

const getWireRequest = (
	wires: PlainWire[],
	resetBatchNumber: boolean,
	context: Context,
	forceQuery?: boolean
): LoadRequest[] =>
	wires.map((wire) => ({
		...wire,
		batchnumber: resetBatchNumber ? 0 : wire.batchnumber,
		params: context.getParams(),
		...(forceQuery && { query: true }),
	}))

export default (
		context: Context,
		wireNames?: string[],
		forceQuery?: boolean
	): ThunkFunc =>
	async (dispatch, getState, platform) => {
		// Turn the list of wires into a load request
		const wires = getWiresFromDefinitonOrContext(wireNames, context)

		const [preloaded, toLoad] = partition(
			wires,
			(wire) => wire.preloaded || wire.viewOnly
		)

		// Some wires have conditions with lookup to other wires,
		// When that wire isn't part of the load, the request will fail
		const lookupWires = listLookupWires(toLoad)
		const missingLookupWires = lookupWires.filter(
			(w) => !wireNames?.includes(w?.missingDependency || "")
		)

		if (missingLookupWires.length) {
			console.table(missingLookupWires, ["wire", "missingDependency"])
			throw new Error(`Wire dependency error, check the table above`)
		}

		const loadRequests = getWireRequest(toLoad, true, context, forceQuery)

		const response = loadRequests.length
			? await platform.loadData(context, {
					wires: loadRequests,
			  })
			: { wires: [], collections: {} }

		const loadedResults = response.wires.map((wire, index) => ({
			...toLoad[index],
			...wire,
			original: { ...wire.data },
		}))

		const preloadedResults = preloaded.map((wire) => ({
			...wire,
			preloaded: false,
		}))

		const allResults = loadedResults.concat(preloadedResults)

		batch(() => {
			dispatch(load([allResults, response.collections]))
			allResults.forEach((wire) => {
				if (wire?.create) {
					dispatch(createrecord(context, wire.name))
				}
			})
		})

		return context
	}

export { getWireRequest, getWiresMap }
