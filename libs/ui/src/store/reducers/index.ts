import { ACTOR, BAND } from "../actions/actions"

import RuntimeState from "../types/runtimestate"
import { StoreAction } from "../actions/actions"
import { getBand } from "../../actor/band"

const mainReducer = (
	state: RuntimeState,
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
