import { WorkspaceState } from "../route/types"

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
	name: string
	namespace: string
	workspace?: WorkspaceState
	definition?: Palette
}

interface ThemeState {
	routeTheme: Theme
	isFetching: boolean
	isCurrentTheme: boolean
}

export { themefetchActionType, Palette, Theme, ThemeState }
