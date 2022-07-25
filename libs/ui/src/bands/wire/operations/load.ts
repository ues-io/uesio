import { Context } from "../../../context/context"
import { WireFieldDefinitionMap } from "../../../definition/wire"
import { LoadRequestField } from "../../../load/loadrequest"
import { nanoid } from "nanoid"
import { PlainWire } from "../types"
import { PlainWireRecord } from "../../wirerecord/types"
import { getLoadRequestConditions } from "../conditions/conditions"
import { listLookupWires } from "../utils"
import {
	getWiresFromDefinitonOrContext,
	load,
	getFullWireId,
	getWireParts,
} from ".."
import { getDefaultRecord } from "../defaults/defaults"
import { ThunkFunc } from "../../../store/store"

function getFieldsRequest(
	fields?: WireFieldDefinitionMap
): LoadRequestField[] | undefined {
	if (!fields) {
		return undefined
	}
	return Object.keys(fields).map((fieldName) => {
		const fieldData = fields[fieldName]
		const subFields = getFieldsRequest(fieldData?.fields)
		return {
			fields: subFields,
			id: fieldName,
		}
	})
}

function getWiresMap(wires: PlainWire[]) {
	const wiresMap: Record<string, PlainWire> = {}
	wires.forEach((wire) => {
		const fullWireId = getFullWireId(wire.view, wire.name)
		wiresMap[fullWireId] = wire
	})
	return wiresMap
}

function getWireRequest(
	wire: PlainWire,
	batchnumber: number,
	context: Context
) {
	const fullWireId = getFullWireId(wire.view, wire.name)
	const wiredef = wire.def
	if (wiredef.viewOnly)
		throw new Error("Cannot get request for viewOnly wire: " + wire.name)
	return {
		wire: fullWireId,
		query: wire.query,
		collection: wiredef.collection,
		fields: getFieldsRequest(wiredef.fields) || [],
		conditions: getLoadRequestConditions(wire.conditions, context),
		order: wire.order,
		batchsize: wiredef.batchsize,
		batchnumber,
		requirewriteaccess: wiredef.requirewriteaccess,
	}
}

export default (context: Context, wires?: string[]): ThunkFunc =>
	async (dispatch, getState, platform) => {
		// Turn the list of wires into a load request
		const wiresToLoad = getWiresFromDefinitonOrContext(wires, context)

		// Some wires have conditions with lookup to other wires,
		// When that wire isn't part of the load, the request will fail
		const lookupWires = listLookupWires(wiresToLoad)
		const missingLookupWires = lookupWires.filter(
			(w) => !wires?.includes(w?.missingDependency || "")
		)
		if (missingLookupWires.length) {
			console.table(missingLookupWires, ["wire", "missingDependency"])
			throw new Error(`Wire dependency error, check the table above`)
		}

		const loadRequests = wiresToLoad
			.filter((wire) => !wire.viewOnly)
			.map((wire) => getWireRequest(wire, 0, context))

		if (!loadRequests.length) {
			return context
		}
		const response = await platform.loadData(context, {
			wires: loadRequests,
		})

		// Add the local ids
		const wiresRequestMap = getWiresMap(wiresToLoad)
		const wiresResponse: Record<string, PlainWire> = {}
		for (const wire of response?.wires || []) {
			const requestWire = wiresRequestMap[wire.wire]
			const [view, name] = getWireParts(wire.wire)
			const data: Record<string, PlainWireRecord> = {}
			const original: Record<string, PlainWireRecord> = {}
			const changes: Record<string, PlainWireRecord> = {}

			const wireDef = requestWire.def

			if (!wireDef) throw new Error("No wiredef found")
			if (wireDef.viewOnly) throw new Error("Cannot load viewOnly wire")
			const autoCreateRecord = !!wireDef.init?.create

			if (autoCreateRecord) {
				wire.data?.push(
					getDefaultRecord(
						context,
						wiresResponse,
						response.collections,
						view,
						wireDef,
						wireDef.collection
					)
				)
			}

			wire.data?.forEach((item) => {
				const localId = nanoid()
				data[localId] = item
				original[localId] = item

				if (autoCreateRecord) {
					changes[localId] = item
				}
			})
			wiresResponse[wire.wire] = {
				name,
				view,
				query: true,
				batchid: nanoid(),
				def: wireDef,
				data,
				original,
				order: requestWire.order,
				changes,
				deletes: {},
				batchnumber: wire.batchnumber,
				more: wire.more,
				errors: undefined,
				conditions: requestWire.conditions,
				collection: wireDef.collection,
			}
		}

		dispatch(load([Object.values(wiresResponse), response.collections]))

		return context
	}

export { getWireRequest, getWiresMap }
