import { Dispatcher } from "../store/store"
import RuntimeState from "../store/types/runtimestate"
import { Platform } from "../platform/platform"
import { Uesio } from "./hooks"
import { StoreAction } from "../store/actions/actions"

class ComponentAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>

	getPackURL = (namespace: string, name: string, buildMode: boolean) =>
		this.dispatcher(
			(dispatch, getState: () => RuntimeState, platform: Platform) =>
				platform.getComponentPackURL(
					this.uesio.getContext(),
					namespace,
					name,
					buildMode
				)
		)
}

export { ComponentAPI }
