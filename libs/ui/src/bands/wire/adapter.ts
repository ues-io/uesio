import { createEntityAdapter } from "@reduxjs/toolkit"
import { Context, getWire } from "../../context/context"
import { RootState } from "../../store/store"
import { PlainWire } from "./types"

const wireAdapter = createEntityAdapter<PlainWire>({
	selectId: (wire) => `${wire.view}/${wire.name}`,
})

const selectors = wireAdapter.getSelectors((state: RootState) => state.wire)

const getWiresFromDefinitonOrContext = (
	wires: string[] | string | undefined,
	context: Context
): PlainWire[] => {
	if (wires) {
		const viewId = context.getViewId()
		const wiresArray = Array.isArray(wires) ? wires : [wires]
		return wiresArray.flatMap((wirename) => {
			const wire = getWire(viewId, wirename)
			return wire
				? [wire]
				: [
						{
							view: viewId || "",
							name: wirename,
							conditions: [],
							data: {},
							original: {},
							changes: {},
							deletes: {},
						},
				  ]
		})
	}
	const wire = context.getPlainWire()
	if (!wire) {
		throw new Error("No Wire in Definition or Context")
	}
	return [wire]
}

export { selectors, getWiresFromDefinitonOrContext }

export default wireAdapter
