import { useRoute } from "../bands/route/selectors"
import { RouteState } from "../bands/route/types"
import { StoreAction } from "../store/actions/actions"
import { Dispatcher } from "../store/store"
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
