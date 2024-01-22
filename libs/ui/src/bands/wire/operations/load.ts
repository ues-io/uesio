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
import { WireConditionState } from "../conditions/conditions"
import { hash } from "@twind/core"

const getParamsHash = (context: Context) => {
	const params = context.getParams()
	if (!params) return ""
	return hash(JSON.stringify(params))
}

const getWireRequest = (context: Context, wires: PlainWire[]): LoadRequest[] =>
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
			loadAll,
			name,
			order,
			query,
			requirewriteaccess,
			view,
			viewOnlyMetadata,
		}) => ({
			batchid,
			batchnumber,
			batchsize,
			collection,
			// Only send active conditions to the server
			conditions: conditions?.filter((c) => !c.inactive),
			fields: !viewOnlyMetadata
				? fields
				: // Strip out view only fields from when building a load request of regular wires
				  fields?.filter(
						(f) => viewOnlyMetadata.fields[f.id] === undefined
				  ),
			name,
			order,
			query,
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

	const paramsHash = getParamsHash(context)

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

	const loadRequests = getWireRequest(context, toLoadWithLookups).map(
		(loadRequest) => {
			if (forceQuery) {
				loadRequest.query = true
			}
			loadRequest.batchnumber = 0
			return loadRequest
		}
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

	const loadedResults = response.wires.map((wire, index) => {
		const originalWire = toLoadWithLookups[index]
		return {
			...originalWire,
			...wire,
			// Since we filtered out inactive conditions from the load request,
			// we need to merge the active conditions back into the result
			conditions: mergeConditions(
				originalWire.conditions,
				wire.conditions
			),
			original: { ...wire.data },
			isLoading: false,
			paramsHash,
			// TODO: If we implement a concept of custom GET_COLLECTION_METADATA for Dynamic collections,
			// then we can remove the `|| wire.query` branch, because "query" will only indicate whether data was queried,
			// not data and possibly extra metadata. But right now Dynamic collections can extend metadata as part of their
			// LOAD code (which is a hack that needs to go away by exposing a GET_COLLECTION_METADATA hook)
			hasLoadedMetadata: wire.hasLoadedMetadata || wire.query !== false,
		} as PlainWire
	})

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
				paramsHash,
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

const mergeConditions = (
	originalConditions: WireConditionState[] | undefined,
	loadedConditions: WireConditionState[] | undefined
) => {
	// Shortcuts:
	// 1. if we have no original conditions, just return whatever we got from loaded conditions
	if (!originalConditions || !originalConditions.length) {
		return loadedConditions
	}
	// 2. if we have no loaded conditions, just return the original conditions
	if (!loadedConditions || !loadedConditions.length) {
		return originalConditions
	}
	// 3. If the array lengths are the same, return loaded conditions
	if (originalConditions.length === loadedConditions.length) {
		return loadedConditions
	}
	// Otherwise, we need to merge the conditions.
	// For the merge, prefer the loaded condition object over the original condition object
	return originalConditions.map((originalCondition) => {
		const loadedCondition = loadedConditions.find(
			(c) => c.id === originalCondition.id
		)
		return loadedCondition || originalCondition
	})
}

export { getWireRequest, getParamsHash }
