import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import { Context } from "../context/context"
import { getPlatform } from "../store/store"
import { useEffect } from "react"
import getMetadata from "../bands/collection/operations/get"
import { Collection } from "../collectionexports"

class CollectionAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useCollection(context: Context, collectionName: string) {
		const plainCollection = useCollection(collectionName)

		useEffect(() => {
			if (!plainCollection) {
				getMetadata(collectionName, context)
			}
		}, [])

		return plainCollection && new Collection(plainCollection)
	}

	createJob = getPlatform().createJob
	importData = getPlatform().importData
}

export { CollectionAPI }
