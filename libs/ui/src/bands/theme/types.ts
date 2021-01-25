interface Palette {
	primary?: string
	secondary?: string
	error?: string
	warning?: string
	info?: string
	success?: string
}

interface ThemeState {
	name: string
	namespace: string
	definition?: Palette
}

export { Palette, ThemeState }
