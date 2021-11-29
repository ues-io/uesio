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
import { LoadRequestBatch } from "../../../load/loadrequest"

function getBatchSize(factor: string, batchsize: number) {
	switch (factor) {
		case "x2":
			return batchsize * 2
		case "x4":
			return batchsize * 4
		default:
			return batchsize
	}
}

// Turn the list of wires into a load request
function getLoadRequestBatch(
	wires: string[] | string | undefined,
	factor: string | undefined,
	context: Context
): [LoadRequestBatch, Record<string, PlainWire>] {
	console.log("wires", wires)

	const wiresToLoad = getWiresFromDefinitonOrContext(wires, context)
	const wiresRequestMap: Record<string, PlainWire> = {}
	const batch = {
		wires: wiresToLoad.map((wire) => {
			console.log("wire", wire)

			const fullWireId = getFullWireId(wire.view, wire.name)
			wiresRequestMap[fullWireId] = wire
			const wiredef = getWireDef(wire)
			if (!wiredef) throw new Error("Invalid Wire: " + wire.name)
			const batchnumber = wire.batchnumber ? wire.batchnumber + 1 : 1
			const batchsize =
				wiredef?.batchsize && factor
					? getBatchSize(factor, wiredef.batchsize)
					: wiredef?.batchsize

			console.log({ wiredef, batchsize })

			return {
				wire: fullWireId,
				type: wiredef.type,
				collection: wiredef.collection,
				fields: getFieldsRequest(wiredef.fields) || [],
				conditions: getLoadRequestConditions(wire.conditions, context),
				order: wiredef.order,
				batchsize,
				batchnumber,
			}
		}),
	}

	return [batch, wiresRequestMap]
}

export default createAsyncThunk<
	[PlainWire[], Record<string, PlainCollection>],
	{
		context: Context
		wires?: string[]
		factor?: string
	},
	UesioThunkAPI
>("wire/loadNextBatch", async ({ context, wires, factor }, api) => {
	const [batch, wiresRequestMap] = getLoadRequestBatch(wires, factor, context)
	const response = await api.extra.loadData(context, batch)

	// Add the local ids
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
			batchnumber: wire.batchNumber,
			hasmorebatches: wire.hasMoreBatches,
		}
	}

	return [Object.values(wiresResponse), response.collections]
})
