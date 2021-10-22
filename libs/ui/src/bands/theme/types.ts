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
interface ThemeStateDefinition {
	spacing: number
	palette: Palette
	variantOverrides: Record<string, DefinitionMap>
}

interface ThemeState {
	name: string
	namespace: string
	definition: ThemeStateDefinition
}

export { Palette, ThemeState, ThemeStateDefinition }
