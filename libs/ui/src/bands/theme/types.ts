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

type ThemeState = {
	theme?: Theme
	isFetching: boolean
}

export { themefetchActionType, Palette, Theme, ThemeState }
