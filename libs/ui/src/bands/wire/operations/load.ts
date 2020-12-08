import { createAsyncThunk } from "@reduxjs/toolkit"

import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { WireFieldDefinitionMap } from "../../../definition/wire"
import { LoadRequestField } from "../../../load/loadrequest"
import {
	getInitializedConditions,
	getLoadRequestConditions,
} from "../../../wire/wirecondition"
import shortid from "shortid"
import { PlainWireRecordMap } from "../../../wire/wirerecord"
import { PlainCollection } from "../../collection/types"
import { PlainWire } from "../types"
import { getDefaultRecord } from "../../../wire/wiredefault"

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
				wire: wire,
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
	const wiresResponse: PlainWire[] =
		response.wires?.map((wire) => {
			const data: PlainWireRecordMap = {}
			const original: PlainWireRecordMap = {}
			wire.data.forEach((item) => {
				const localId = shortid.generate()
				data[localId] = item
				original[localId] = item
			})

			return {
				name: wire.wire,
				view: viewId,
				data,
				original,
				changes: {},
				deletes: {},
				error: undefined,
				conditions: [],
			}
		}) || []

	// Add defaults to response
	for (const wire of batch.wires) {
		if (wire.type === "CREATE") {
			const localId = shortid.generate()
			wiresResponse.push({
				name: wire.wire,
				view: viewId,
				data: {
					[localId]: getDefaultRecord(
						context,
						api.getState(),
						viewId,
						wire.wire
					),
				},
				original: {},
				changes: {
					[localId]: getDefaultRecord(
						context,
						api.getState(),
						viewId,
						wire.wire
					),
				},
				deletes: {},
				error: undefined,
				conditions: [],
			})
		}
	}

	return [wiresResponse, response.collections]
})
