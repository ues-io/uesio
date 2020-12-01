enum actionTypes {
	themefetch = "themefetch",
	themefetching = "themefetching",
}

interface Palette {
	primary: string
	secondary: string
	error: string
	warning: string
	info: string
	success: string
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
	type: actionTypes.themefetch
	payload: Theme
}

interface ActionFetching extends BaseAction {
	type: actionTypes.themefetching
	payload: boolean
}

export { actionTypes, Palette, Theme, ThemeState, ActionFetching, ActionFetch }
