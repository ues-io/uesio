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
		return plainCollection ? new Collection(plainCollection) : undefined
	}
}

export { CollectionAPI }
