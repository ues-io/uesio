import { StoreAction } from "../store/actions/actions"
import { Dispatcher, useRoute } from "../store/store"
import RouteState from "../store/types/routestate"
import { Uesio } from "./hooks"

class RouteAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>

	useRoute(): RouteState {
		return useRoute()
	}
}

export { RouteAPI }
