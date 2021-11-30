import { createAsyncThunk } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { UesioThunkAPI } from "../../utils"
import shortid from "shortid"
import { PlainCollection } from "../../collection/types"
import { PlainWire } from "../types"
import { PlainWireRecord } from "../../wirerecord/types"
import { getWiresFromDefinitonOrContext } from "../adapter"
import { getWireRequest, getWiresMap } from "./load"

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
	const response = await api.extra.loadData(context, {
		wires: wiresToLoad.map((wire) =>
			getWireRequest(wire, wire.batchnumber + 1, context)
		),
	})

	// Add the local ids
	const wiresRequestMap = getWiresMap(wiresToLoad)
	const wiresResponse: Record<string, PlainWire> = {}
	for (const wire of response?.wires || []) {
		const requestWire = wiresRequestMap[wire.wire]
		const [view, name] = wire.wire.split("/")
		const data: Record<string, PlainWireRecord> = {}
		const original: Record<string, PlainWireRecord> = {}

		wire.data?.forEach((item) => {
			const localId = shortid.generate()
			data[localId] = item
			original[localId] = item
		})
		wiresResponse[wire.wire] = {
			name,
			view,
			type: requestWire.type,
			batchid: requestWire.batchid,
			data: {
				...requestWire.data,
				...data,
			},
			original: {
				...requestWire.original,
				...original,
			},
			changes: requestWire.changes,
			deletes: requestWire.deletes,
			batchnumber: requestWire.batchnumber,
			more: wire.more,
			error: undefined,
			conditions: requestWire.conditions,
		}
	}

	return [Object.values(wiresResponse), response.collections]
})
