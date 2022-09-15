import { Context } from "../../../context/context"
import { ViewOnlyField, WireFieldDefinitionMap } from "../../../definition/wire"
import { LoadRequest, LoadRequestField } from "../../../load/loadrequest"
import { PlainWire } from "../types"
import { listLookupWires } from "../utils"
import { getWiresFromDefinitonOrContext, load, getFullWireId } from ".."
import { ThunkFunc } from "../../../store/store"
import createrecord from "./createrecord"
import { batch } from "react-redux"

function getFieldsRequest(
	fields?: WireFieldDefinitionMap | Record<string, ViewOnlyField>
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
		if (wire.viewOnly) return []
		return {
			...wire,
			batchnumber: resetBatchNumber ? 0 : wire.batchnumber,
			data: {},
			params: context.getParams(),
			query: true,
		}
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

		response.wires.forEach((wire) => (wire.original = { ...wire.data }))

		batch(() => {
			dispatch(load([response.wires, response.collections]))
			response.wires.forEach((wire) => {
				if (wire?.create) {
					dispatch(createrecord(context, wire.name))
				}
			})
		})

		return context
	}

export { getWireRequest, getWiresMap, getFieldsRequest }
