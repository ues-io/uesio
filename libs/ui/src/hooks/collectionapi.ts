import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import { Context } from "../context/context"
import { Dispatcher, getPlatform } from "../store/store"
import { useEffect } from "react"
import getMetadata from "../bands/collection/operations/get"
import { Collection } from "../collectionexports"
import { Spec } from "../definition/definition"

class CollectionAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher

	useCollection(context: Context, collectionName: string) {
		const plainCollection = useCollection(collectionName)

		useEffect(() => {
			if (!plainCollection) {
				this.dispatcher(getMetadata(collectionName, context))
			}
		}, [])

		return plainCollection && new Collection(plainCollection)
	}

	createJob(context: Context, spec: Spec) {
		return getPlatform().createJob(context, spec)
	}
	importData(context: Context, fileData: File, jobId: string) {
		return getPlatform().importData(context, fileData, jobId)
	}
}

export { CollectionAPI }
