import { useCollection, useCollections } from "../bands/collection/selectors"
import {
	getFullWireId,
	useWire as uWire,
	useWires as uWires,
	removeOne as removeWire,
} from "../bands/wire"
import Wire from "../bands/wire/class"
import loadWiresOp from "../bands/wire/operations/load"
import initWiresOp from "../bands/wire/operations/initialize"
import { Context } from "../context/context"
import { WireDefinition } from "../definition/wire"
import { useEffect } from "react"
import { dispatch } from "../store/store"

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
	useEffect(() => {
		if (!wireDef || !wireName) return
		if (!wireDef.viewOnly && !wireDef.collection) return
		initWires(context, {
			[wireName]: wireDef,
		})
		loadWires(context, [wireName])
		return () => {
			remove(wireName, context)
		}
	}, [wireName, JSON.stringify(wireDef)])
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
