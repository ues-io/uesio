import { Theme } from "@theme-ui/css"
interface Colors {
	primary: string
	secondary: string
	error: string
	warning: string
	info: string
	success: string
	// Allow any key as well, but require a minimum of the above
	[key: string]: string
}

type ThemeState = Theme

export { Colors, ThemeState }
