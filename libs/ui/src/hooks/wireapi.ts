import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import { getFullWireId, useWire, useWires } from "../bands/wire/selectors"
import Wire from "../bands/wire/class"
import loadWiresOp from "../bands/wire/operations/load"
import initializeWiresOp from "../bands/wire/operations/initialize"
import { Context } from "../context/context"
import { WireDefinition } from "../definition/wire"
import { useEffect } from "react"

// This is the wire api exposed on the uesio object returned
// to components using the useUesio hook.
class WireAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	// Wraps our store's useWire result (POJO) in a nice Wire class
	// with convenience methods to make the api easier to consume for end users.
	useWire(wireName?: string) {
		const view = wireName
			? this.uesio.getViewId()
			: this.uesio.getContext().findWireFrame()?.getViewId()
		const name = wireName || this.uesio.getContext().getWireId()
		const plainWire = useWire(view, name)
		const collectionName = plainWire?.collection
		const plainCollection = useCollection(collectionName)
		if (!plainCollection) return undefined
		return new Wire(plainWire).attachCollection(plainCollection)
	}

	useDynamicWire(
		wireName: string,
		wireDef: WireDefinition | null,
		doLoad?: boolean
	) {
		const context = this.uesio.getContext()
		const wire = this.useWire(wireName)
		useEffect(() => {
			if (wire || !wireDef || !wireName) return
			this.initWires(context, {
				[wireName]: wireDef,
			})
			doLoad && this.loadWires(context, [wireName])
		}, [wireName, JSON.stringify(wireDef)])
		return wire
	}

	useWires(wireNames: string[]) {
		const view = this.uesio.getViewId() || ""
		const fullWireIds = wireNames.map((wirename) =>
			getFullWireId(view, wirename)
		)
		const plainWires = useWires(fullWireIds)
		return Object.fromEntries(
			Object.entries(plainWires).map(([key, plainWire]) => {
				const collectionName = plainWire?.collection
				const plainCollection = useCollection(collectionName)
				if (!plainCollection) return [key, undefined]
				return [
					key.slice(view.length + 1),
					new Wire(plainWire).attachCollection(plainCollection),
				]
			})
		)
	}

	loadWires(context: Context, wireNames: string[]) {
		return this.uesio.getDispatcher()(
			loadWiresOp({
				context,
				wires: wireNames,
			})
		)
	}

	initWires(context: Context, wireDefs: Record<string, WireDefinition>) {
		return this.uesio.getDispatcher()(initializeWiresOp(context, wireDefs))
	}
}

export { WireAPI }
