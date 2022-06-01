import { appDispatch } from "../store/store"
import { Uesio } from "./hooks"
import { LoadRequestBatch } from "../load/loadrequest"
import { Context } from "../context/context"

class PlatformAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	loadData = (context: Context, request: LoadRequestBatch) =>
		appDispatch()((dispatch, getState, platform) =>
			platform.loadData(context, request)
		)
}

export { PlatformAPI }
