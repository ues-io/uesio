import { createAsyncThunk, Dictionary } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
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
		wires: string[]
	},
	UesioThunkAPI
>("wire/load", async ({ context, wires }, api) => {
	// Turn the list of wires into a load request
	const viewId = context.getViewId()
	if (!viewId) throw new Error("No View Provided")
	const batch = {
		wires: wires.map((wire) => {
			const wiredef = context.getWireDef(wire)
			if (!wiredef) throw new Error("Invalid Wire: " + wire)
			return {
				wire,
				type: wiredef.type,
				collection: wiredef.collection,
				fields: getFieldsRequest(wiredef.fields) || [],
				conditions: getLoadRequestConditions(
					getInitializedConditions(wiredef.conditions),
					context
				),
			}
		}),
	}
	const response = await api.extra.loadData(context, batch)

	// Add the local ids
	const wiresResponse: Dictionary<PlainWire> = {}
	for (const wire of response?.wires || []) {
		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		wire.data?.forEach((item) => {
			const localId = shortid.generate()
			data[localId] = item
			original[localId] = item
		})
		wiresResponse[getFullWireId(viewId, wire.wire)] = {
			name: wire.wire,
			view: viewId,
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
			wiresResponse[getFullWireId(viewId, wire.wire)] = {
				name: wire.wire,
				view: viewId,
				data: {
					[localId]: getDefaultRecord(
						context,
						wiresResponse,
						viewId,
						wire.wire
					),
				},
				original: {},
				changes: {
					[localId]: getDefaultRecord(
						context,
						wiresResponse,
						viewId,
						wire.wire
					),
				},
				deletes: {},
				error: undefined,
				conditions: [],
			}
		}
	}
	const wiresArray: PlainWire[] = []
	for (const wireKey in wiresResponse) {
		const wire = wiresResponse[wireKey]
		if (wire) wiresArray.push(wire)
	}

	return [wiresArray, response.collections]
})
