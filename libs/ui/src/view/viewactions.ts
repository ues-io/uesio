import { ViewParams } from "./view"
import { ActorAction } from "../store/actions/actions"

const SET_PARAMS = "SET_PARAMS"
const SET_LOADED = "SET_LOADED"

interface SetParamsAction extends ActorAction {
	name: typeof SET_PARAMS
	data: {
		params?: ViewParams
	}
}

interface SetLoadedAction extends ActorAction {
	name: typeof SET_LOADED
}

export { SET_PARAMS, SET_LOADED, SetParamsAction, SetLoadedAction }
