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
import { Context } from "../context/context"
import { WireDefinition } from "../definition/wire"
import { useDeepCompareEffect } from "react-use"
import { dispatch } from "../store/store"
import { PlainCollectionMap } from "../bands/collection/types"

// Wraps our store's useWire result (POJO) in a nice Wire class
// with convenience methods to make the api easier to consume for end users.
const useWire = (wireId: string | undefined, context: Context) => {
	const [view, wire] = context.getViewAndWireId(wireId)
	const plainWire = uWire(view, wire)
	const collectionName = plainWire?.collection
	const plainCollection = useCollection(collectionName)
	if (!plainCollection) return undefined
	return new Wire(plainWire).attachCollection(plainCollection)
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
	// This Hook handles wireName changes --- there's a lot more work to do here.
	useDeepCompareEffect(() => {
		if (!wireDef || !wireName) return
		initWiresOp(context, {
			[wireName]: wireDef,
		})
		loadWiresOp(context, [wireName])
		return () => {
			remove(wireName, context)
		}
	}, [wireName, wireDef])

	// This Hook runs if any change is made to the wire definition,
	// but we don't need to update as much state, so this logic is split out
	useDeepCompareEffect(() => {
		if (!wire || !wireDef) return
		const collections: PlainCollectionMap = {}
		const initializedWires = initExistingWire(
			wire.source,
			wireDef,
			collections
		)
		dispatch(init([[initializedWires], collections]))
	}, [!!wire, wireDef])
	return wire
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
	const collectionNames = Object.values(plainWires).map(
		(plainWire) => plainWire?.collection || ""
	)
	const collections = useCollections(collectionNames)

	return Object.fromEntries(
		Object.entries(plainWires).map(([, plainWire]) => {
			if (!plainWire || !plainWire.collection)
				return [plainWire?.name, undefined]

			const plainCollection = collections[plainWire.collection]
			if (!plainCollection) return [plainWire?.name, undefined]
			return [
				plainWire?.name,
				new Wire(plainWire).attachCollection(plainCollection),
			]
		})
	)
}

const loadWires = loadWiresOp

const initWires = initWiresOp

export { useWire, useDynamicWire, useWires, loadWires, initWires }
