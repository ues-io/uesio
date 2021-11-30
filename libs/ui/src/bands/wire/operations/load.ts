import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context, getWireDef } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { WireFieldDefinitionMap } from "../../../definition/wire"
import { LoadRequestField } from "../../../load/loadrequest"
import shortid from "shortid"
import { PlainCollection } from "../../collection/types"
import { PlainWire } from "../types"
import { getFullWireId } from "../selectors"
import { PlainWireRecord } from "../../wirerecord/types"
import { getLoadRequestConditions } from "../conditions/conditions"
import { getDefaultRecord } from "../defaults/defaults"
import { getWiresFromDefinitonOrContext } from "../adapter"

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
	return {
		wire: fullWireId,
		type: wiredef.type,
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
	const response = await api.extra.loadData(context, {
		wires: wiresToLoad.map((wire) => getWireRequest(wire, 0, context)),
	})

	// Add the local ids
	const wiresRequestMap = getWiresMap(wiresToLoad)
	const wiresResponse: Record<string, PlainWire> = {}
	for (const wire of response?.wires || []) {
		const requestWire = wiresRequestMap[wire.wire]
		const [view, name] = wire.wire.split("/")
		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		const changes: Record<string, PlainWireRecord> = {}

		if (requestWire.type === "CREATE") {
			wire.data?.push(
				getDefaultRecord(
					context,
					wiresResponse,
					response.collections,
					view,
					name
				)
			)
		}

		wire.data?.forEach((item) => {
			const localId = shortid.generate()
			data[localId] = item
			original[localId] = item

			if (requestWire.type === "CREATE") {
				changes[localId] = item
			}
		})
		wiresResponse[wire.wire] = {
			name,
			view,
			type: requestWire.type,
			batchid: shortid.generate(),
			data,
			original,
			changes,
			deletes: {},
			batchnumber: requestWire.batchnumber,
			more: wire.more,
			error: undefined,
			conditions: requestWire.conditions,
		}
	}

	return [Object.values(wiresResponse), response.collections]
})

export { getWireRequest, getWiresMap }
