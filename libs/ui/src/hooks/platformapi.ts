import { Dispatcher } from "../store/store"
import RuntimeState from "../store/types/runtimestate"
import { Platform } from "../platform/platform"
import { LoginRequest } from "../auth/auth"
import { Uesio } from "./hooks"
import { LoadRequestBatch } from "../load/loadrequest"
import { StoreAction } from "../store/actions/actions"
import { Context } from "../context/context"

class PlatformAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>

	login = (request: LoginRequest) =>
		this.dispatcher(
			async (
				dispatch,
				getState: () => RuntimeState,
				platform: Platform
			) => platform.login(request)
		)

	loadData = (context: Context, request: LoadRequestBatch) =>
		this.dispatcher(
			async (
				dispatch,
				getState: () => RuntimeState,
				platform: Platform
			) => platform.loadData(context, request)
		)
}

export { PlatformAPI }
