import { Reducer } from "redux"
import { ThemeState, actionTypes, ActionFetch, ActionFetching } from "./types"

const initialState = {
	theme: {},
	isFetching: false,
}

const reducer: Reducer<ThemeState> = (
	state = initialState,
	action: ActionFetching | ActionFetch
) => {
	if (action.type === actionTypes.themefetching) {
		return {
			...state,
			isFetching: action.payload,
		}
	} else if (action.type === actionTypes.themefetch) {
		return {
			theme: action.payload,
			isFetching: false,
		}
	} else {
		return state
	}
}

export default reducer
