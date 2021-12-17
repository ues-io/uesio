import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import { Context } from "../context/context"
import { Dispatcher, getPlatform } from "../store/store"
import { AnyAction } from "redux"
import { useEffect } from "react"
import get from "../bands/collection/operations/get"
import { Collection } from "../collectionexports"
import { ImportSpec } from "../definition/definition"

class CollectionAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useCollection(context: Context, collectionName: string) {
		const plainCollection = useCollection(collectionName)

		useEffect(() => {
			if (!plainCollection) {
				this.dispatcher(
					get.collectionMetadata({
						collectionName,
						context,
					})
				)
			}
		}, [])

		return plainCollection && new Collection(plainCollection)
	}

	createImportJob(context: Context, spec: ImportSpec) {
		return getPlatform().createImportJob(context, spec)
	}
	importData(context: Context, fileData: File, jobId: string) {
		return getPlatform().importData(context, fileData, jobId)
	}
}

export { CollectionAPI }
