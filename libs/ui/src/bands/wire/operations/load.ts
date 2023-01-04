import { Context } from "../../../context/context"
import { LoadRequest } from "../../../load/loadrequest"
import { PlainWire } from "../types"
import {
	getWiresFromDefinitonOrContext,
	load,
	addLookupWires,
	setIsLoading,
} from ".."
import { dispatch } from "../../../store/store"
import createrecord from "./createrecord"
import partition from "lodash/partition"
import { batch } from "react-redux"
import { platform } from "../../../platform/platform"

const getWireRequest = (
	wires: PlainWire[],
	resetBatchNumber: boolean,
	context: Context,
	forceQuery?: boolean
): LoadRequest[] =>
	wires.map((wire) => ({
		...wire,
		conditions: wire.conditions?.filter(
			(condition) => condition.active !== false
		),
		batchnumber: resetBatchNumber ? 0 : wire.batchnumber,
		params: context.getParams(),
		...(forceQuery && { query: true }),
	}))

export default async (
	context: Context,
	wireNames?: string[],
	forceQuery?: boolean
) => {
	// Turn the list of wires into a load request
	const wires = getWiresFromDefinitonOrContext(wireNames, context)

	const [preloaded, toLoad] = partition(
		wires,
		(wire) => wire.preloaded || wire.viewOnly
	)

	const toLoadWithLookups = addLookupWires(toLoad, context)

	const loadRequests = getWireRequest(
		toLoadWithLookups,
		true,
		context,
		forceQuery
	)

	if (toLoadWithLookups.length) {
		// Set the loading state for all wires
		dispatch(setIsLoading(toLoadWithLookups))
	}

	const response = loadRequests.length
		? await platform.loadData(context, {
				wires: loadRequests,
		  })
		: { wires: [], collections: {} }

	const loadedResults = response.wires.map((wire, index) => ({
		...toLoadWithLookups[index],
		...wire,
		original: { ...wire.data },
		isLoading: false,
	}))

	const preloadedResults = preloaded.map((wire) => ({
		...wire,
		preloaded: false,
		isLoading: false,
	}))

	const allResults = loadedResults.concat(preloadedResults)

	batch(() => {
		dispatch(load([allResults, response.collections]))
		allResults.forEach((wire) => {
			if (wire?.create) {
				createrecord(context, wire.name)
			}
		})
	})

	return context
}

export { getWireRequest }
