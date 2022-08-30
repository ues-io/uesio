import { Context } from "../../../context/context"
import { WireFieldDefinitionMap } from "../../../definition/wire"
import { LoadRequest, LoadRequestField } from "../../../load/loadrequest"
import { PlainWire } from "../types"
import { listLookupWires } from "../utils"
import { getWiresFromDefinitonOrContext, load, getFullWireId } from ".."
import { ThunkFunc } from "../../../store/store"
import createrecord from "./createrecord"
import { batch } from "react-redux"

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
	wires: PlainWire[],
	resetBatchNumber: boolean,
	context: Context
): LoadRequest[] {
	return wires.flatMap((wire) => {
		const wireDef = wire.def
		if (!wireDef) throw new Error("Could not find wire def")
		if (wireDef.viewOnly) return []
		return [
			{
				...wire,
				batchnumber: resetBatchNumber ? 0 : wire.batchnumber,
				fields: getFieldsRequest(wireDef.fields) || [],
				params: context.getParams(),
				requirewriteaccess: wireDef.requirewriteaccess,
			},
		]
	})
}

export default (context: Context, wires?: string[]): ThunkFunc =>
	async (dispatch, getState, platform) => {
		// Turn the list of wires into a load request
		const wiresToLoad = getWiresFromDefinitonOrContext(wires, context)

		// Some wires have conditions with lookup to other wires,
		// When that wire isn't part of the load, the request will fail
		const lookupWires = listLookupWires(wiresToLoad)
		const missingLookupWires = lookupWires.filter(
			(w) => !wires?.includes(w?.missingDependency || "")
		)
		if (missingLookupWires.length) {
			console.table(missingLookupWires, ["wire", "missingDependency"])
			throw new Error(`Wire dependency error, check the table above`)
		}

		const loadRequests = getWireRequest(wiresToLoad, true, context)

		if (!loadRequests.length) {
			return context
		}
		const response = await platform.loadData(context, {
			wires: loadRequests,
		})

		// merge the old info back in.
		response.wires.forEach((wire, index) => {
			const oldWire = wiresToLoad[index]
			wire.def = oldWire.def
		})

		batch(() => {
			dispatch(load([response.wires, response.collections]))
			response.wires.forEach((wire) => {
				if (wire.def?.init?.create) {
					dispatch(createrecord(context, wire.name))
				}
			})
		})

		return context
	}

export { getWireRequest, getWiresMap, getFieldsRequest }
