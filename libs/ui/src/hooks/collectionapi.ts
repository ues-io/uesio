import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import Collection from "../bands/collection/class"

class CollectionAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useCollection(collectionName?: string) {
		const plainCollection = useCollection(collectionName)
		if (!plainCollection) return undefined
		return new Collection(plainCollection)
	}
}

export { CollectionAPI }
