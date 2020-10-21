import { Dispatcher, useWire, useCollection } from "../store/store"
import { Wire } from "../wire/wire"
import { Uesio } from "./hooks"
import { PlainCollection } from "../collection/collection"
import { StoreAction } from "../store/actions/actions"

// This is the wire api exposed on the uesio object returned
// to components using the useUesio hook.
class WireAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>
	//TODO:: This is not a great place for this IMO
	useCollection(collectionName: string): PlainCollection | null {
		return useCollection(collectionName)
	}
	// Wraps our store's useWire result (POJO) in a nice Wire class
	// with convenience methods to make the api easier to consume for end users.
	useWire(wireName: string): Wire {
		const plainWire = useWire(wireName, this.uesio.getView()?.getId())
		const plainCollection = useCollection(plainWire && plainWire.collection)
		return new Wire(plainWire)
			.attachCollection(plainCollection)
			.attachDispatcher(this.dispatcher)
	}
}

export { WireAPI }
