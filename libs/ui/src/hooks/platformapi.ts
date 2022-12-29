import { Uesio } from "./hooks"
import { LoadRequestBatch } from "../load/loadrequest"
import { Context } from "../context/context"
import { platform } from "../platform/platform"

class PlatformAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	loadData = (context: Context, request: LoadRequestBatch) =>
		platform.loadData(context, request)
}

export { PlatformAPI }
