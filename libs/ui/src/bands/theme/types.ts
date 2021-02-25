import { DefinitionMap } from "../../definition/definition"

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
	definition: {
		spacing?: number
		palette?: Record<string, string>
		variantOverrides?: Record<string, DefinitionMap>
	}
}

export { Palette, ThemeState }
