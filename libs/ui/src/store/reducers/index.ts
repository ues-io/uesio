import { ACTOR, ActorAction, BAND, BandAction } from "../actions/actions"

import RuntimeState from "../types/runtimestate"
import { getBand } from "../../actor/band"

import collectionReducer from "../../bands/collection"
import routeReducer from "../../bands/route"
import userReducer from "../../bands/user"
import builderReducer from "../../bands/builder"
import viewDefReducer from "../../bands/viewdef"
import themeReducer from "../../bands/theme"
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
			route: routeReducer(state.route, action),
			user: userReducer(state.user, action),
			builder: builderReducer(state.builder, action),
			viewdef: viewDefReducer(state.viewdef, action),
			theme: themeReducer(state.theme, action),
		},
	}
}

export { mainReducer }
