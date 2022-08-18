import { Context } from "../../../context/context"
import { nanoid } from "nanoid"
import { PlainWire } from "../types"
import { PlainWireRecord } from "../../wirerecord/types"
import { getWireParts, getWiresFromDefinitonOrContext, load } from ".."
import { getWireRequest, getWiresMap } from "./load"
import { ThunkFunc } from "../../../store/store"

export default (context: Context, wires?: string[]): ThunkFunc =>
	async (dispatch, getState, platform) => {
		// Turn the list of wires into a load request
		const wiresToLoad = getWiresFromDefinitonOrContext(wires, context)
		const response = await platform.loadData(context, {
			wires: wiresToLoad.map((wire) =>
				getWireRequest(wire, wire.batchnumber, context)
			),
		})

		// Add in the local ids
		const wiresRequestMap = getWiresMap(wiresToLoad)
		const wiresResponse: Record<string, PlainWire> = {}
		for (const wire of response?.wires || []) {
			const requestWire = wiresRequestMap[wire.wire]
			const [view, name] = getWireParts(wire.wire)
			const data: Record<string, PlainWireRecord> = {}
			const original: Record<string, PlainWireRecord> = {}

			wire.data?.forEach((item) => {
				const localId = nanoid()
				data[localId] = item
				original[localId] = item
			})
			wiresResponse[wire.wire] = {
				name,
				view,
				query: true,
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
				def: requestWire.def,
				deletes: requestWire.deletes,
				batchnumber: requestWire.batchnumber + 1,
				more: wire.more,
				errors: undefined,
				conditions: requestWire.conditions,
				order: requestWire.order,
				collection: wire.collection,
			}
		}

		dispatch(load([Object.values(wiresResponse), response.collections]))
		return context
	}
