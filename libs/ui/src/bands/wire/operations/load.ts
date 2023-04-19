import { Context } from "../../../context/context"
import { LoadRequest } from "../../../load/loadrequest"
import { PlainWire } from "../types"
import {
	getWiresFromDefinitonOrContext,
	load,
	addLookupWires,
	setIsLoading,
	addErrorState,
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
	wires.map(
		({
			// Select the specific properties that we want to include in the load,
			// to avoid sending things like data/changes/originals which are not needed for loads
			batchid,
			batchnumber,
			collection,
			conditions,
			fields,
			name,
			order,
			query,
			requirewriteaccess,
			view,
			loadAll,
		}) => ({
			batchid,
			batchnumber: resetBatchNumber ? 0 : batchnumber,
			collection,
			conditions: conditions?.filter(
				(condition) => condition.active !== false
			),
			fields,
			name,
			order,
			params: context.getParams(),
			query: forceQuery ? true : query,
			requirewriteaccess,
			view,
			loadAll,
		})
	)

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

	const [invalidWires, validToLoad] = partition(
		toLoad,
		(wire) => !wire.collection
	)

	const toLoadWithLookups = addLookupWires(validToLoad, context)

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

	const invalidWiresResults = invalidWires.map((wire) => ({
		...wire,
		error: addErrorState(wire.errors, "Invalid Wire Definition"),
		isLoading: false,
	}))

	const preloadedResults = preloaded.map((wire) => ({
		...wire,
		preloaded: false,
		isLoading: false,
	}))

	const allResults = loadedResults.concat(
		preloadedResults,
		invalidWiresResults
	)

	batch(() => {
		dispatch(load([allResults, response.collections]))
		allResults.forEach((wire) => {
			if (wire.create && !Object.keys(wire.data).length) {
				createrecord(context, wire.name)
			}
		})
	})

	// Run wire events
	wires.forEach((w) =>
		context.getWire(w.name)?.handleEvent("onLoadSuccess", context)
	)

	return context
}

export { getWireRequest }
