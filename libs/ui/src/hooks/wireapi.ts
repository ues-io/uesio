import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import { useWire } from "../bands/wire/selectors"
import Wire from "../bands/wire/class"
import loadWiresOp from "../bands/wire/operations/load"
import { Context } from "../context/context"

// This is the wire api exposed on the uesio object returned
// to components using the useUesio hook.
class WireAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	// Wraps our store's useWire result (POJO) in a nice Wire class
	// with convenience methods to make the api easier to consume for end users.
	useWire(wireName: string) {
		const plainWire = useWire(this.uesio.getViewId(), wireName)
		const wireDef = this.uesio.getWireDef(wireName)
		const collectionName = wireDef?.collection
		const plainCollection = useCollection(collectionName)
		if (!plainCollection) return undefined
		return new Wire(plainWire).attachCollection(plainCollection)
	}

	loadWires(context: Context, wireNames: string[]) {
		return this.uesio.getDispatcher()(
			loadWiresOp({
				context,
				wires: wireNames,
			})
		)
	}
}

export { WireAPI }
