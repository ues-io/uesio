enum actionTypes {
	THEME_FETCH = "THEME_FETCH",
	THEME_FETCHING = "THEME_FETCHING",
}

interface Palette {
	primary?: string
	secondary?: string
	error?: string
	warning?: string
	info?: string
	success?: string
}

interface Theme {
	id?: string
	name?: string
	namespace?: string
	workspace?: string
	definition?: Palette
}

interface ThemeState {
	theme?: Theme
	isFetching?: boolean
}

interface BaseAction {
	type: keyof typeof actionTypes
}

interface ActionFetch extends BaseAction {
	type: actionTypes.THEME_FETCH
	payload: Theme
}

interface ActionFetching extends BaseAction {
	type: actionTypes.THEME_FETCHING
	payload: boolean
}

export { actionTypes, Palette, Theme, ThemeState, ActionFetching, ActionFetch }
