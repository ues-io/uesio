import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import Collection from "../bands/collection/class"
import { getPlatform } from "../store/store"
import { Context } from "../context/context"
import { JobMappingParams } from "../platform/platform"
class CollectionAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useCollection(collectionName?: string) {
		const plainCollection = useCollection(collectionName)
		return plainCollection ? new Collection(plainCollection) : undefined
	}

	createImportJob(
		context: Context,
		filetype: string,
		collection: string,
		upsertkey?: string,
		mappings?: JobMappingParams
	) {
		return getPlatform().createImportJob(
			context,
			filetype,
			collection,
			upsertkey,
			mappings
		)
	}
	importData(context: Context, fileData: File, jobId: string) {
		return getPlatform().importData(context, fileData, jobId)
	}
}

export { CollectionAPI }
