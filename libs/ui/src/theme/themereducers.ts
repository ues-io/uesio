import { Reducer } from "redux"
import {
	ThemeState,
	actionTypes,
	ActionFetch,
	ActionFetching,
} from "./themetypes"

const initialState = {
	theme: {},
	isFetching: false,
}

const reducer: Reducer<ThemeState> = (
	state = initialState,
	action: ActionFetching | ActionFetch
) => {
	if (action.type === actionTypes.THEME_FETCHING) {
		return {
			...state,
			isFetching: action.payload,
		}
	} else if (action.type === actionTypes.THEME_FETCH) {
		return {
			theme: action.payload,
			isFetching: false,
		}
	} else {
		return state
	}
}

export default reducer
