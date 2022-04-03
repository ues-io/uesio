import { createAsyncThunk } from "@reduxjs/toolkit"
import {
	Context,
	getWireDef,
	getWireDefFromWireName,
} from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { WireFieldDefinitionMap } from "../../../definition/wire"
import { LoadRequestField } from "../../../load/loadrequest"
import { nanoid } from "nanoid"
import { PlainCollection } from "../../collection/types"
import { PlainWire } from "../types"
import { getFullWireId } from "../selectors"
import { PlainWireRecord } from "../../wirerecord/types"
import { getLoadRequestConditions } from "../conditions/conditions"
import { getWiresFromDefinitonOrContext } from "../adapter"
import { getDefaultRecord } from "../defaults/defaults"

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
	const wiredef = getWireDef(wire)
	if (!wiredef) throw new Error("Invalid Wire: " + wire.name)
	if (wiredef.viewOnly)
		throw new Error("Cannot get request for viewOnly wire: " + wire.name)
	return {
		wire: fullWireId,
		query: wire.query,
		collection: wiredef.collection,
		fields: getFieldsRequest(wiredef.fields) || [],
		conditions: getLoadRequestConditions(wire.conditions, context),
		order: wiredef.order,
		batchsize: wiredef.batchsize,
		batchnumber,
	}
}

export default createAsyncThunk<
	[PlainWire[], Record<string, PlainCollection>],
	{
		context: Context
		wires?: string[]
	},
	UesioThunkAPI
>("wire/load", async ({ context, wires }, api) => {
	// Turn the list of wires into a load request
	const wiresToLoad = getWiresFromDefinitonOrContext(wires, context)
	const loadRequests = wiresToLoad
		.filter((wire) => !wire.viewOnly)
		.map((wire) => getWireRequest(wire, 0, context))

	if (!loadRequests.length) {
		return [[], {}]
	}
	const response = await api.extra.loadData(context, {
		wires: loadRequests,
	})

	// Add the local ids
	const wiresRequestMap = getWiresMap(wiresToLoad)
	const wiresResponse: Record<string, PlainWire> = {}
	for (const wire of response?.wires || []) {
		const requestWire = wiresRequestMap[wire.wire]
		const [viewNsUser, viewName, name] = wire.wire.split("/")
		const view = `${viewNsUser}/${viewName}`
		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		const changes: Record<string, PlainWireRecord> = {}

		const wireDef = getWireDefFromWireName(view, name)

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
					wireDef
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
			data,
			original,
			changes,
			deletes: {},
			batchnumber: wire.batchnumber,
			more: wire.more,
			error: undefined,
			conditions: requestWire.conditions,
			collection: wireDef.collection,
		}
	}

	return [Object.values(wiresResponse), response.collections]
})

export { getWireRequest, getWiresMap }
