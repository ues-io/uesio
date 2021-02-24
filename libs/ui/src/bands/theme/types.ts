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
		palette?: Palette
		variantOverrides?: DefinitionMap
	}
}

export { Palette, ThemeState }
