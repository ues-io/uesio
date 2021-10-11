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
import {
	getInitializedConditions,
	getLoadRequestConditions,
} from "../conditions/conditions"
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
	const batch = {
		wires: wiresToLoad
			.map((wire) => {
				const wiredef = getWireDef(wire)
				if (!wiredef) throw new Error("Invalid Wire: " + wire.name)
				return {
					wire: getFullWireId(wire.view, wire.name),
					type: wiredef.type,
					collection: wiredef.collection,
					fields: getFieldsRequest(wiredef.fields) || [],
					conditions: getLoadRequestConditions(
						getInitializedConditions(wiredef.conditions),
						context
					),
					order: wiredef.order,
					limit: wiredef.limit,
					offset: wiredef.offset,
				}
			})
			.filter((w) => !!w.collection || !!w.fields.length),
	}

	const response = await api.extra.loadData(context, batch)

	// Add the local ids
	const wiresResponse: Record<string, PlainWire> = {}
	for (const wire of response?.wires || []) {
		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		wire.data?.forEach((item) => {
			const localId = shortid.generate()
			data[localId] = item
			original[localId] = item
		})
		const [view, name] = wire.wire.split("/")
		wiresResponse[wire.wire] = {
			name,
			view,
			data,
			original,
			changes: {},
			deletes: {},
			error: undefined,
			conditions: [],
		}
	}

	// Add defaults to response
	for (const wire of batch.wires) {
		if (wire.type === "CREATE") {
			const localId = shortid.generate()
			const [view, name] = wire.wire.split("/")
			wiresResponse[wire.wire] = {
				name,
				view,
				data: {
					[localId]: getDefaultRecord(
						context,
						wiresResponse,
						response.collections,
						view,
						name
					),
				},
				original: {},
				changes: {
					[localId]: getDefaultRecord(
						context,
						wiresResponse,
						response.collections,
						view,
						name
					),
				},
				deletes: {},
				error: undefined,
				conditions: [],
			}
		}
	}

	return [Object.values(wiresResponse), response.collections]
})
