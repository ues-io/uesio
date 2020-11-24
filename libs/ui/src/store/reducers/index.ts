import { ACTOR, BAND } from "../actions/actions"

import RuntimeState from "../types/runtimestate"
import { StoreAction } from "../actions/actions"
import { getBand } from "../../actor/band"

const defaultState = {
	collection: {},
	view: {},
	viewdef: {},
	route: {
		viewname: "",
		viewnamespace: "",
		namespace: "",
		path: "",
		theme: "",
	},
	user: {
		site: "",
		firstname: "",
		lastname: "",
		profile: "",
	},
	site: {
		name: "",
		app: "",
		version: "",
	},
	theme: {},
}

const mainReducer = (
	state: RuntimeState = defaultState,
	action: StoreAction
): RuntimeState => {
	const band = getBand(action.band)

	if (band) {
		if (action.type === ACTOR) {
			if (action.target) {
				const actor = band.getActor(state, action.target, action.view)
				return actor.receiveAction(action, state)
			}
		} else if (action.type === BAND) {
			return band.receiveAction(action, state)
		}
	}

	return state
}

export { mainReducer }
