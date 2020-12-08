import { createAsyncThunk } from "@reduxjs/toolkit"

import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import { LoadResponseBatch } from "../../../load/loadresponse"
import { WireFieldDefinitionMap } from "../../../definition/wire"
import { LoadRequestField } from "../../../load/loadrequest"
import {
	getInitializedConditions,
	getLoadRequestConditions,
} from "../../../wire/wirecondition"

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
	[LoadResponseBatch, string],
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
	return [response, viewId]
})
