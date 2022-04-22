import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"
import { LoadRequestBatch } from "../load/loadrequest"
import { Context } from "../context/context"
import { AnyAction } from "redux"
import { MetadataType } from "../metadataexports"

class PlatformAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	loadData = (context: Context, request: LoadRequestBatch) =>
		this.dispatcher((dispatch, getState, platform) =>
			platform.loadData(context, request)
		)
	getMetadata = (
		context: Context,
		name: string,
		metadataType: MetadataType,
		namespace: string,
		grouping?: string
	) =>
		this.dispatcher((dispatch, getState, platform) =>
			platform.getMetadata(
				context,
				name,
				metadataType,
				namespace,
				grouping
			)
		)
}

export { PlatformAPI }
