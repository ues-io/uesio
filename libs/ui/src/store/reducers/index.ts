import { ACTOR, ActorAction, BAND, BandAction } from "../actions/actions"

import RuntimeState from "../types/runtimestate"
import { getBand } from "../../actor/band"

import collectionReducer from "../../bands/collection"
import { AnyAction } from "redux"

const mainReducer = (state: RuntimeState, action: AnyAction): RuntimeState => {
	const band = getBand(action.band)

	// Old method of running action reducers
	// TODO: Remove this completely
	if (band) {
		if (action.type === ACTOR) {
			if (action.target) {
				const actor = band.getActor(state, action.target, action.view)
				return actor.receiveAction(action as ActorAction, state)
			}
		} else if (action.type === BAND) {
			return band.receiveAction(action as BandAction, state)
		}
	}

	// If we didn't find a band use our new ducks!
	// Couldn't use combineReducers yet here because we need all of them
	// to be in this format.
	return {
		...state,
		...{
			collection: collectionReducer(state.collection, action),
		},
	}
}

export { mainReducer }
