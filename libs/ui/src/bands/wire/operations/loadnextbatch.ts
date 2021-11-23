import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context, getWireDef } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import shortid from "shortid"
import { PlainCollection } from "../../collection/types"
import { PlainWire } from "../types"
import { getFullWireId } from "../selectors"
import { PlainWireRecord } from "../../wirerecord/types"
import { getLoadRequestConditions } from "../conditions/conditions"
import { getDefaultRecord } from "../defaults/defaults"
import { getWiresFromDefinitonOrContext } from "../adapter"
import { getFieldsRequest } from "./load"

export default createAsyncThunk<
	[PlainWire[], Record<string, PlainCollection>],
	{
		context: Context
		wires?: string[]
	},
	UesioThunkAPI
>("wire/loadNextBatch", async ({ context, wires }, api) => {
	// Turn the list of wires into a load request
	const wiresToLoad = getWiresFromDefinitonOrContext(wires, context)
	const wiresRequestMap: Record<string, PlainWire> = {}
	const batch = {
		wires: wiresToLoad.map((wire) => {
			const fullWireId = getFullWireId(wire.view, wire.name)
			wiresRequestMap[fullWireId] = wire
			const wiredef = getWireDef(wire)
			if (!wiredef) throw new Error("Invalid Wire: " + wire.name)

			const batchnumber = wire.batchnumber ? wire.batchnumber + 1 : 1

			console.log("LOAD NEXT batchnumber", batchnumber)

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
		}),
	}
	const response = await api.extra.loadData(context, batch)

	// Add the local ids
	const wiresResponse: Record<string, PlainWire> = {}
	for (const wire of response?.wires || []) {
		const requestWire = wiresRequestMap[wire.wire]
		const [view, name] = wire.wire.split("/")
		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}
		const changes: Record<string, PlainWireRecord> = {}

		const wireStore = batch.wires.find((obj) => obj.wire === wire.wire)

		console.log("requestWire", requestWire)

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

		for (const key in requestWire.data) {
			data[key] = requestWire.data[key]
		}

		for (const key in requestWire.original) {
			original[key] = requestWire.original[key]
		}

		for (const key in requestWire.changes) {
			changes[key] = requestWire.changes[key]
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
			error: undefined,
			conditions: requestWire.conditions,
			batchnumber: wireStore?.batchnumber,
		}
	}

	return [Object.values(wiresResponse), response.collections]
})
