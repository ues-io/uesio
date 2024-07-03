import { useCollection, useCollections } from "../bands/collection/selectors"
import {
	getFullWireId,
	useWire as uWire,
	useWires as uWires,
	removeOne as removeWire,
	init,
} from "../bands/wire"
import Wire from "../bands/wire/class"
import loadWiresOp from "../bands/wire/operations/load"
import initWiresOp, {
	initExistingWire,
} from "../bands/wire/operations/initialize"
import { Context, getWire } from "../context/context"
import { WireDefinition } from "../definition/wire"
import { useEffect, useRef } from "react"
import { useDeepCompareEffect } from "react-use"
import { dispatch, getCurrentState } from "../store/store"
import { ID_FIELD } from "../bands/collection/types"
import { PlainWireRecord } from "../bands/wirerecord/types"

const useExternalRecord = (collection: string, record: string) => {
	// loop through all wires, regardless of view to get ones with
	// the requested collection and record
	const state = getCurrentState()
	let foundRecord: PlainWireRecord | undefined
	const wire = Object.values(state.wire.entities).find((plainWire) => {
		if (!plainWire || plainWire.collection !== collection) return false
		foundRecord = Object.values(plainWire.data).find(
			(currentRecord) => currentRecord[ID_FIELD] === record
		)
		return foundRecord
	})
	uWire(wire?.view, wire?.name)
	return foundRecord
}

// Wraps our store's useWire result (POJO) in a nice Wire class
// with convenience methods to make the api easier to consume for end users.
const useWire = (wireId: string | undefined, context: Context) => {
	const [view, wire] = context.getViewAndWireId(wireId)
	const plainWire = uWire(view, wire)
	const collection = useCollection(plainWire?.collection)
	if (!plainWire) return undefined
	return new Wire(plainWire).attachCollection(collection)
}

const useWires = (
	wireNames: string[],
	context: Context
): { [k: string]: Wire | undefined } => {
	const view = context.getViewId() || ""
	const fullWireIds = wireNames.map((wirename) =>
		getFullWireId(view, wirename)
	)
	const plainWires = uWires(fullWireIds)
	const collections = useCollections(
		Object.values(plainWires).map(
			(plainWire) => plainWire?.collection || ""
		)
	)
	return Object.fromEntries(
		Object.entries(plainWires).map(([wireId, plainWire]) => {
			if (!plainWire) {
				return [wireId, undefined]
			}
			return [
				plainWire.name,
				new Wire(plainWire).attachCollection(
					collections[plainWire.collection]
				),
			]
		})
	)
}

const remove = (wireId: string, context: Context) => {
	const [view, wire] = context.getViewAndWireId(wireId)
	if (!view || !wire) return
	dispatch(removeWire(getFullWireId(view, wire)))
}

const useDynamicWire = (
	wireName: string,
	wireDef: WireDefinition | null,
	context: Context
) => {
	const wire = useWire(wireName, context)
	const currentDef = useRef(wireDef)
	// This Hook handles wireName changes --- there's a lot more work to do here.
	useEffect(() => {
		if (!wireDef || !wireName) return
		const initAndLoad = async () => {
			initWiresOp(context, {
				[wireName]: wireDef,
			})
			await loadWiresOp(context, [wireName])
		}
		initAndLoad()
		return () => {
			remove(wireName, context)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [wireName, !!wireDef])

	// This Hook runs if any change is made to the wire definition,
	// but we don't need to update as much state, so this logic is split out
	useDeepCompareEffect(() => {
		if (!wire || !wireDef || wireDef === currentDef.current) return
		const initializedWires = initExistingWire(wire.source, wireDef)
		dispatch(init([[initializedWires], undefined, undefined]))
		currentDef.current = wireDef
	}, [!!wire, wireDef])
	return wire
}

const loadWires = loadWiresOp

const initWires = initWiresOp

export {
	useWire,
	useExternalRecord,
	useDynamicWire,
	useWires,
	loadWires,
	initWires,
	getWire,
}
