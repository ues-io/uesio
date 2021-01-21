import { RouteState } from "../route/types"

const themefetchActionType = "theme/fetch"

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
	theme: Theme
	isFetching: boolean
	isActiveTheme: boolean
	route: NonNullable<RouteState>
}

export { themefetchActionType, Palette, Theme, ThemeState }
