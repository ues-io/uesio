import { createEntityAdapter } from "@reduxjs/toolkit"
import { Context, getWire, getWireDefFromWireName } from "../../context/context"
import { RootState } from "../../store/store"
import { getInitializedConditions } from "./conditions/conditions"
import { PlainWire } from "./types"

const wireAdapter = createEntityAdapter<PlainWire>({
	selectId: (wire) => `${wire.view}/${wire.name}`,
})

const selectors = wireAdapter.getSelectors((state: RootState) => state.wire)

const initializeWire = (viewId: string, wirename: string): PlainWire => {
	const wireDef = getWireDefFromWireName(viewId, wirename)
	if (!wireDef) throw new Error("Cannot initialize invalid wire")
	return {
		view: viewId || "",
		type: wireDef.type || "QUERY",
		name: wirename,
		conditions: getInitializedConditions(wireDef.conditions),
		batchid: "",
		batchnumber: 0,
		data: {},
		original: {},
		changes: {},
		deletes: {},
	}
}

const getWiresFromDefinitonOrContext = (
	wires: string[] | string | undefined,
	context: Context
): PlainWire[] => {
	if (wires) {
		const viewId = context.getViewId()
		if (!viewId) throw new Error("No ViewId in Context")
		const wiresArray = Array.isArray(wires) ? wires : [wires]
		return wiresArray.flatMap((wirename) => {
			const wire = getWire(viewId, wirename)
			return wire ? [wire] : [initializeWire(viewId, wirename)]
		})
	}
	const wire = context.getPlainWire()
	if (!wire) throw new Error("No Wire in Definition or Context")
	return [wire]
}

export { selectors, getWiresFromDefinitonOrContext }

export default wireAdapter
