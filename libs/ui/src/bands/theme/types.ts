import { DefinitionMap } from "../../definition/definition"

interface Palette {
	primary: string
	secondary: string
	error: string
	warning: string
	info: string
	success: string
	// Allow any key as well, but require a minimum of the above
	[key: string]: string
}

interface ThemeState {
	name: string
	namespace: string
	definition: {
		spacing: number
		palette: Palette
		variantOverrides: Record<string, DefinitionMap>
		icons: {
			panels: "call_to_action"
		}
	}
}

export { Palette, ThemeState }
