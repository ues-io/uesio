import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"
import { LoadRequestBatch } from "../load/loadrequest"
import { Context } from "../context/context"
import { AnyAction } from "redux"

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
}

export { PlatformAPI }
