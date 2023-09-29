import { Context } from "../../../context/context"
import { LoadRequest } from "../../../load/loadrequest"
import { LoadResponseBatch } from "../../../load/loadresponse"
import { platform } from "../../../platform/platform"
import { PlainWire } from "../types"
import {
	getWiresFromDefinitonOrContext,
	load,
	addLookupWires,
	setIsLoading,
	addErrorState,
} from ".."
import { dispatch } from "../../../store/store"
import { createRecordOp } from "./createrecord"
import partition from "lodash/partition"
import { batch } from "react-redux"
import { addError } from "../../../../src/hooks/notificationapi"

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
			batchsize,
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
			batchsize,
			collection,
			conditions,
			fields,
			name,
			order,
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

	const haveWiresNeedingMetadata = wires?.some(
		(wire) =>
			!wire.viewOnly &&
			// TODO: If we implement a concept of custom GET_COLLECTION_METADATA for Dynamic collections,
			// then we can remove the && wire.query` branch here, because "query" will only indicate whether data was queried,
			// not data and possibly extra metadata. But right now Dynamic collections can extend metadata as part of their
			// LOAD code (which is a hack that needs to go away by exposing a GET_COLLECTION_METADATA hook)
			!(wire.preloaded && wire.query !== false) &&
			wire.collection &&
			!wire.hasLoadedMetadata
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

	let response: LoadResponseBatch
	try {
		response = loadRequests.length
			? await platform.loadData(context, {
					wires: loadRequests,
					includeMetadata: haveWiresNeedingMetadata,
			  })
			: { wires: [], collections: {} }
	} catch (e) {
		const errMessage =
			((e as unknown as Error)?.message as string) ||
			`Unable to load data: ${e}`
		const errContext = context.addErrorFrame([errMessage])
		// If we were unable to load the data, invoke error handlers for all wires.
		// If there ARE no error handlers on any wires, invoke a default error handler
		// which just displays a notification.
		const wireWithOnLoadError = wires.find((wire) => {
			if (Array.isArray(wire.events)) {
				return wire.events.find((event) => event.type === "onLoadError")
			} else {
				return undefined
			}
		})
		if (wireWithOnLoadError) {
			wires.forEach((w) =>
				errContext
					.getWire(w.name)
					?.handleEvent("onLoadError", errContext)
			)
		} else {
			addError(errMessage, errContext)
		}
		return errContext
	}

	const loadedResults = response.wires.map(
		(wire, index) =>
			({
				...toLoadWithLookups[index],
				...wire,
				original: { ...wire.data },
				isLoading: false,
				// TODO: If we implement a concept of custom GET_COLLECTION_METADATA for Dynamic collections,
				// then we can remove the `|| wire.query` branch, because "query" will only indicate whether data was queried,
				// not data and possibly extra metadata. But right now Dynamic collections can extend metadata as part of their
				// LOAD code (which is a hack that needs to go away by exposing a GET_COLLECTION_METADATA hook)
				hasLoadedMetadata:
					wire.hasLoadedMetadata || wire.query !== false,
			} as PlainWire)
	)

	const invalidWiresResults = invalidWires.map(
		(wire) =>
			({
				...wire,
				error: addErrorState(wire.errors, "Invalid Wire Definition"),
				isLoading: false,
			} as PlainWire)
	)

	const preloadedResults = preloaded.map(
		(wire) =>
			({
				...wire,
				preloaded: false,
				isLoading: false,
				// TODO: If we implement a concept of custom GET_COLLECTION_METADATA for Dynamic collections,
				// then we can just set this to true all the time, because "query" will only indicate whether data was queried,
				// not data and possibly extra metadata. But right now Dynamic collections can extend metadata as part of their
				// LOAD code (which is a hack that needs to go away by exposing a GET_COLLECTION_METADATA hook)
				hasLoadedMetadata: wire.query !== false,
			} as PlainWire)
	)

	const allResults = loadedResults.concat(
		preloadedResults,
		invalidWiresResults
	)

	batch(() => {
		dispatch(load([allResults, response.collections]))
		allResults.forEach((wire) => {
			if (wire.create && !Object.keys(wire.data).length) {
				createRecordOp({ context, wireName: wire.name })
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
