import { useRoute } from "../bands/route/selectors"
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

	useRoute = useRoute
}

export { RouteAPI }
